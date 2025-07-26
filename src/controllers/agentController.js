const { admin } = require('../utils/firebase');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const logger = require('../config/logger');
const axios = require('axios');

exports.createSession = catchAsync(async (req, res) => {
    //generate a  uuid userid
    const userId = `123e4567-e89b-12d3-a456-426614174000`;
    const appName = 'sahayak';
    const state = {

    "name": "Saloni",
    "school_info": {
        "name": "St. Xavier's High School",
        "location": "Solapur, Maharashtra, India",
        "type": "Public School"
    },
    "classes": [
        {
            "grade": 6,
            "subjects": ["Science"],
            "classId": "1235465"
          
        },
        {
            "grade": 7,
            "subjects": ["Science"],
            "classId": "1235466"
        }
    ],
    "timetable": {
        "class_6": {
            "Monday": [
                {"subject": "Science", "time": "9:00-10:00"},
                {"subject": "Science", "time": "11:00-12:00"}
            ],
            "Wednesday": [
                {"subject": "Science", "time": "10:00-11:00"}
            ]
        },
        "class_7": {
            "Tuesday": [
                {"subject": "Science", "time": "9:00-10:00"}
            ],
            "Thursday": [
                {"subject": "Science", "time": "11:00-12:00"}
            ]
        }
    },
    "year_calendar": {
            "term_1": {
                "start_date": "2025-06-15",
                "end_date": "2025-09-30"
            },
            "term_2": {
                "start_date": "2025-10-16",
                "end_date": "2026-03-15"
            },
            "holidays": [
                {"name": "Diwali", "date": "2025-11-01"},
                {"name": "Christmas", "date": "2025-12-25"}
            ],
            "exams": [
                {"name": "Mid-term Exams", "start_date": "2025-09-01", "end_date": "2025-09-10"},
                {"name": "Final Exams", "start_date": "2026-03-01", "end_date": "2026-03-10"}
            ],
            "events": [
                {"name": "Science Fair", "date": "2025-08-15"},
                {"name": "Parent-Teacher Meeting", "date": "2025-10-05"},
                {"name": "Annual Day", "date": "2025-12-20"},
                {"name": "Sports Day", "date": "2026-02-10"}
            ]

        
    },
    "current_grade": {},
    "curriculum": {},
    "current_lesson_plan":{},
    "current_content_generated": {},
    "current_student_profiles": {},
    "retrieval_query": "",
    "generated_lesson_plans": [],
    "current_date": "2025-06-15",
    "slide_contents": {}
}




    // Call sahayak agent with proper URL path structure
    const response = await axios({
        method: 'POST',
        url: `${config.sahayakAgentUrl}/apps/${appName}/users/${userId}/sessions`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.sahayakApiKey}`,
        },
        data: {
            state,
        }
    });


    if (response.status !== 200) {
        logger.error(`Failed to create session: ${response.statusText}`);
        return res.status(500).json({
            success: false,
            message: 'Failed to create session',
        });
    }
    const sessionData = response.data;
    const sessionId = sessionData.id;

    // Assuming you have a function to create a session in your database
    const session = await admin.firestore().collection('sessions').add({
        sessionId,
        createdAt: new Date(),
    });

    return res.status(201).json({
        success: true,
        data: {
            id: session.id,
            ...sessionData,
        },
    });
});

const get_image = async (image_filename, image_version, sessionId) => {
    try {
        const response = await axios({
            method: 'GET',
            url: `${config.sahayakAgentUrl}/apps/sahayak/users/123e4567-e89b-12d3-a456-426614174000/sessions/${sessionId}/artifacts/${image_filename}`,
            headers: {
                Authorization: `Bearer ${config.sahayakApiKey}`,
            },
        });

        return {
            ...response.data,
            inlineData: {
                ...response.data.inlineData,
                data: Buffer.from(response.data.inlineData.data, 'base64').toString('base64')
            }
        };
    } catch (error) {
        logger.error(`Failed to get image: ${error}`);
        // throw new Error('Failed to get image');
    }
};

exports.newMessage = catchAsync(async (req, res) => {
    const { sessionId, text, fileData } = req.body;

    if (!sessionId || !text) {
        return res.status(400).json({
            success: false,
            message: 'Session ID and message are required',
        });
    }

    const data = {
        "appName": "sahayak",
        "sessionId": sessionId,
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "newMessage": {
            "parts": [{}],
            "role": "user",
        }
    }

    if (text) {
        data.newMessage.parts[0] = {
            "text": text,
        };
    }

    // Call sahayak agent to send a new message
    const response = await axios({
        method: 'POST',
        url: `${config.sahayakAgentUrl}/run`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.sahayakApiKey}`,
        },
        data: data
    });

    if (response.status !== 200) {
        logger.error(`Failed to send message: ${response.statusText}`);
        return res.status(500).json({
            success: false,
            message: 'Failed to send message',
        });
    }

    const responseData = response.data;

    let finalData = [];
    if (responseData) {
        for (const data of responseData) {
            const contentPart = data?.content?.parts?.[0];
            console.log('Content Part:', contentPart);
            if (contentPart) {
                if (contentPart.functionResponse && contentPart.functionResponse.name === 'create_slide_images') {
                    console.log('Processing slide images...');
                    // Process each slide and get its image
                    const slideContents = contentPart.functionResponse.response.slide_contents;
                    for (const slide of slideContents.slides) {
                        slide.image = await get_image(slide.image_filename, slide.image_version, sessionId);
                    }
                    
                    // Handle presentation generator response
                    finalData.push({
                        data: slideContents,
                        type: 'presentation_generator',
                        author: data.author
                    });
                } else if (contentPart.text) {
                    if (data?.author === 'curriculum_planner' && contentPart.text.startsWith('```json')) {
                        try {
                            const jsonData = JSON.parse(contentPart.text.replace('```json', '').replace('```', '').trim());
                            finalData.push({
                                data: jsonData,
                                type: 'curriculum_planner',
                            });
                        } catch (error) {
                            logger.error(`Failed to parse JSON: ${error}`);
                            finalData.push({
                                text: contentPart.text,
                                type: 'text',
                            });
                        }
                    } else if (data?.author === 'lesson_designer' && contentPart.text.startsWith('```json')) {
                        try {
                            const jsonData = JSON.parse(contentPart.text.replace('```json', '').replace('```', '').trim());
                            finalData.push({
                                data: jsonData,
                                type: 'lesson_designer',
                            });
                        } catch (error) {
                            logger.error(`Failed to parse JSON: ${error}`);
                            finalData.push({
                                text: contentPart.text,
                                type: 'text',
                            });
                        }
                    } else if (contentPart.functionResponse && contentPart.functionResponse.name === 'create_slide_images') {
                        console.log('Processing slide images...');
                        // Process each slide and get its image
                        const slideContents = contentPart.functionResponse.response.slide_contents;
                        for (const slide of slideContents.slides) {
                            slide.image = await get_image(slide.image_filename, slide.image_version, sessionId);
                        }
                        
                        // Handle presentation generator response
                        finalData.push({
                            data: slideContents.data,
                            type: 'presentation_generator',
                            author: data.author
                        });
                    } else {
                        finalData.push({
                            text: contentPart.text,
                            type: 'text',
                            author: data.author
                        });
                    }
                }
            }
        }
    }

    console.log('Final Data:', finalData);

    return res.status(200).json({
        success: true,
        data: finalData,
    });
});

exports.FCMToken = catchAsync(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'FCM token is required',
        });
    }

    // Here you can save the token to your database or perform any other action
    // For demonstration, we will just log it
    logger.info(`Received FCM token: ${token}`);

    //save to firebase
    try {
        await admin.firestore().collection('fcm_tokens').doc(token).set({
            token,
            createdAt: new Date(),
        });
    } catch (error) {
        logger.error(`Failed to save FCM token: ${error}`);
        return res.status(500).json({
            success: false,
            message: 'Failed to save FCM token',
        });
    }

    return res.status(200).json({
        success: true,
        message: 'FCM token received successfully',
    });
});