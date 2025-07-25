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
            return response.data;
        } catch (error) {
            logger.error(`Failed to get image: ${error}`);
            throw new Error('Failed to get image');
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

    // // Call sahayak agent to send a new message
    // const response = await axios({
    //     method: 'POST',
    //     url: `${config.sahayakAgentUrl}/run`,
    //     headers: {
    //         'Content-Type': 'application/json',
    //         Authorization: `Bearer ${config.sahayakApiKey}`,
    //     },
    //     data: data
    // });

    // if (response.status !== 200) {
    //     logger.error(`Failed to send message: ${response.statusText}`);
    //     return res.status(500).json({
    //         success: false,
    //         message: 'Failed to send message',
    //     });
    // }

    // const responseData = response.data;

    const responseData =  [
        {
            "content": {
                "parts": [
                    {
                        "functionCall": {
                            "id": "adk-338e5a24-14f7-4617-9db5-c38d0d58157b",
                            "args": {
                                "agent_name": "presentation_generator"
                            },
                            "name": "transfer_to_agent"
                        }
                    }
                ],
                "role": "model"
            },
            "usageMetadata": {
                "candidatesTokenCount": 11,
                "candidatesTokensDetails": [
                    {
                        "modality": "TEXT",
                        "tokenCount": 11
                    }
                ],
                "promptTokenCount": 1207,
                "promptTokensDetails": [
                    {
                        "modality": "TEXT",
                        "tokenCount": 1207
                    }
                ],
                "thoughtsTokenCount": 111,
                "totalTokenCount": 1329,
                "trafficType": "ON_DEMAND"
            },
            "invocationId": "e-315ceb57-0e98-4f7c-84e1-433ea1eb2280",
            "author": "TeacherAssistant",
            "actions": {
                "stateDelta": {},
                "artifactDelta": {},
                "requestedAuthConfigs": {}
            },
            "longRunningToolIds": [],
            "id": "c1ccc2de-398f-4c99-8df1-a0d54b47c454",
            "timestamp": 1753435896.672223
        },
        {
            "content": {
                "parts": [
                    {
                        "functionResponse": {
                            "id": "adk-338e5a24-14f7-4617-9db5-c38d0d58157b",
                            "name": "transfer_to_agent",
                            "response": {
                                "result": null
                            }
                        }
                    }
                ],
                "role": "user"
            },
            "invocationId": "e-315ceb57-0e98-4f7c-84e1-433ea1eb2280",
            "author": "TeacherAssistant",
            "actions": {
                "stateDelta": {},
                "artifactDelta": {},
                "transferToAgent": "presentation_generator",
                "requestedAuthConfigs": {}
            },
            "id": "256addc9-dd21-492f-8ea3-8603fa8e32d8",
            "timestamp": 1753435901.301018
        },
        {
            "content": {
                "parts": [
                    {
                        "functionCall": {
                            "id": "adk-6d641331-0f7d-42d5-9d1d-81c18176db50",
                            "args": {
                                "request": "Generate 1 more slide for a quick presentation on \"Diversity in the Living World\" for Grade 6. The slide should continue the engaging and informative tone for a 6th-grade audience, focusing on how living things are grouped."
                            },
                            "name": "generate_slide_contents"
                        }
                    }
                ],
                "role": "model"
            },
            "usageMetadata": {
                "candidatesTokenCount": 54,
                "candidatesTokensDetails": [
                    {
                        "modality": "TEXT",
                        "tokenCount": 54
                    }
                ],
                "promptTokenCount": 1622,
                "promptTokensDetails": [
                    {
                        "modality": "TEXT",
                        "tokenCount": 1622
                    }
                ],
                "thoughtsTokenCount": 98,
                "totalTokenCount": 1774,
                "trafficType": "ON_DEMAND"
            },
            "invocationId": "e-315ceb57-0e98-4f7c-84e1-433ea1eb2280",
            "author": "presentation_generator",
            "actions": {
                "stateDelta": {},
                "artifactDelta": {},
                "requestedAuthConfigs": {}
            },
            "longRunningToolIds": [],
            "id": "df54025e-54cd-4ec3-a350-caaeaae2c2d8",
            "timestamp": 1753435901.311371
        },
        {
            "content": {
                "parts": [
                    {
                        "functionResponse": {
                            "id": "adk-6d641331-0f7d-42d5-9d1d-81c18176db50",
                            "name": "generate_slide_contents",
                            "response": {
                                "slides": [
                                    {
                                        "heading": "How We Group Living Things",
                                        "points": [
                                            "With millions of different living things on Earth, it would be impossible to study them all individually!",
                                            "Scientists group living things based on their shared characteristics and differences. This process is called classification.",
                                            "Grouping helps us to organize information, understand how different organisms are related, and discover new species more easily.",
                                            "Think of it like organizing books in a library or how students at St. Xavier's High School are grouped into different classes; it helps keep things orderly and easy to find.",
                                            "Living things are broadly categorized into major groups like Plants (trees, flowers), Animals (mammals, insects), Fungi (mushrooms, molds), and tiny Microbes (bacteria, viruses)."
                                        ],
                                        "image_description": "A colorful infographic showing a simplified 'Tree of Life' diagram. The main branches are clearly labeled 'Plants', 'Animals', 'Fungi', and 'Microbes', each with small, representative cartoon icons (e.g., a leafy tree for plants, a lion for animals, a mushroom for fungi, and a magnified bacterial cell for microbes). The background should suggest a diverse natural environment."
                                    }
                                ]
                            }
                        }
                    }
                ],
                "role": "user"
            },
            "invocationId": "e-315ceb57-0e98-4f7c-84e1-433ea1eb2280",
            "author": "presentation_generator",
            "actions": {
                "stateDelta": {
                    "slide_contents": {
                        "slides": [
                            {
                                "heading": "How We Group Living Things",
                                "points": [
                                    "With millions of different living things on Earth, it would be impossible to study them all individually!",
                                    "Scientists group living things based on their shared characteristics and differences. This process is called classification.",
                                    "Grouping helps us to organize information, understand how different organisms are related, and discover new species more easily.",
                                    "Think of it like organizing books in a library or how students at St. Xavier's High School are grouped into different classes; it helps keep things orderly and easy to find.",
                                    "Living things are broadly categorized into major groups like Plants (trees, flowers), Animals (mammals, insects), Fungi (mushrooms, molds), and tiny Microbes (bacteria, viruses)."
                                ],
                                "image_description": "A colorful infographic showing a simplified 'Tree of Life' diagram. The main branches are clearly labeled 'Plants', 'Animals', 'Fungi', and 'Microbes', each with small, representative cartoon icons (e.g., a leafy tree for plants, a lion for animals, a mushroom for fungi, and a magnified bacterial cell for microbes). The background should suggest a diverse natural environment.",
                                "image_filename": "slide_image_1.png",
                                "image_version": 1
                            }
                        ]
                    }
                },
                "artifactDelta": {},
                "requestedAuthConfigs": {}
            },
            "id": "3bd2a834-a953-4a8b-a1a7-b1144c8dc4d0",
            "timestamp": 1753435916.175563
        },
        {
            "content": {
                "parts": [
                    {
                        "functionCall": {
                            "id": "adk-20ff1b28-3751-4777-98b0-af33abf9bb85",
                            "args": {},
                            "name": "create_slide_images"
                        }
                    }
                ],
                "role": "model"
            },
            "usageMetadata": {
                "candidatesTokenCount": 5,
                "candidatesTokensDetails": [
                    {
                        "modality": "TEXT",
                        "tokenCount": 5
                    }
                ],
                "promptTokenCount": 1918,
                "promptTokensDetails": [
                    {
                        "modality": "TEXT",
                        "tokenCount": 1918
                    }
                ],
                "thoughtsTokenCount": 52,
                "totalTokenCount": 1975,
                "trafficType": "ON_DEMAND"
            },
            "invocationId": "e-315ceb57-0e98-4f7c-84e1-433ea1eb2280",
            "author": "presentation_generator",
            "actions": {
                "stateDelta": {},
                "artifactDelta": {},
                "requestedAuthConfigs": {}
            },
            "longRunningToolIds": [],
            "id": "64c91efa-6e93-47ae-889c-b475359d0e64",
            "timestamp": 1753435916.178524
        },
        {
            "content": {
                "parts": [
                    {
                        "functionResponse": {
                            "id": "adk-20ff1b28-3751-4777-98b0-af33abf9bb85",
                            "name": "create_slide_images",
                            "response": {
                                "status": "success",
                                "message": "Images generated and slides updated",
                                "slide_contents": {
                                    "slides": [
                                        {
                                            "heading": "How We Group Living Things",
                                            "points": [
                                                "With millions of different living things on Earth, it would be impossible to study them all individually!",
                                                "Scientists group living things based on their shared characteristics and differences. This process is called classification.",
                                                "Grouping helps us to organize information, understand how different organisms are related, and discover new species more easily.",
                                                "Think of it like organizing books in a library or how students at St. Xavier's High School are grouped into different classes; it helps keep things orderly and easy to find.",
                                                "Living things are broadly categorized into major groups like Plants (trees, flowers), Animals (mammals, insects), Fungi (mushrooms, molds), and tiny Microbes (bacteria, viruses)."
                                            ],
                                            "image_description": "A colorful infographic showing a simplified 'Tree of Life' diagram. The main branches are clearly labeled 'Plants', 'Animals', 'Fungi', and 'Microbes', each with small, representative cartoon icons (e.g., a leafy tree for plants, a lion for animals, a mushroom for fungi, and a magnified bacterial cell for microbes). The background should suggest a diverse natural environment.",
                                            "image_filename": "slide_image_1.png",
                                            "image_version": 1
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ],
                "role": "user"
            },
            "invocationId": "e-315ceb57-0e98-4f7c-84e1-433ea1eb2280",
            "author": "presentation_generator",
            "actions": {
                "stateDelta": {
                    "slide_contents": {
                        "slides": [
                            {
                                "heading": "How We Group Living Things",
                                "points": [
                                    "With millions of different living things on Earth, it would be impossible to study them all individually!",
                                    "Scientists group living things based on their shared characteristics and differences. This process is called classification.",
                                    "Grouping helps us to organize information, understand how different organisms are related, and discover new species more easily.",
                                    "Think of it like organizing books in a library or how students at St. Xavier's High School are grouped into different classes; it helps keep things orderly and easy to find.",
                                    "Living things are broadly categorized into major groups like Plants (trees, flowers), Animals (mammals, insects), Fungi (mushrooms, molds), and tiny Microbes (bacteria, viruses)."
                                ],
                                "image_description": "A colorful infographic showing a simplified 'Tree of Life' diagram. The main branches are clearly labeled 'Plants', 'Animals', 'Fungi', and 'Microbes', each with small, representative cartoon icons (e.g., a leafy tree for plants, a lion for animals, a mushroom for fungi, and a magnified bacterial cell for microbes). The background should suggest a diverse natural environment.",
                                "image_filename": "slide_image_1.png",
                                "image_version": 1
                            }
                        ]
                    }
                },
                "artifactDelta": {
                    "slide_image_1.png": 1
                },
                "requestedAuthConfigs": {}
            },
            "id": "e924fcbd-5045-4a32-9b90-e5c43b222933",
            "timestamp": 1753435929.998599
        },
        {
            "content": {
                "parts": [
                    {
                        "text": "Here's another informative slide for your presentation, focusing on how scientists group living things to better understand Earth's amazing diversity. It includes an image to visually represent classification."
                    }
                ],
                "role": "model"
            },
            "usageMetadata": {
                "candidatesTokenCount": 35,
                "candidatesTokensDetails": [
                    {
                        "modality": "TEXT",
                        "tokenCount": 35
                    }
                ],
                "promptTokenCount": 2196,
                "promptTokensDetails": [
                    {
                        "modality": "TEXT",
                        "tokenCount": 2196
                    }
                ],
                "thoughtsTokenCount": 137,
                "totalTokenCount": 2368,
                "trafficType": "ON_DEMAND"
            },
            "invocationId": "e-315ceb57-0e98-4f7c-84e1-433ea1eb2280",
            "author": "presentation_generator",
            "actions": {
                "stateDelta": {},
                "artifactDelta": {},
                "requestedAuthConfigs": {}
            },
            "id": "ff98fc60-6c59-4381-909e-5bec29f7f683",
            "timestamp": 1753435930.00174
        }
    ]
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