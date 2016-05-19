var defaultChallenge = {
    //    "userId": 8547899,
    "projectId": -1,
    "tcDirectProjectId": -1,
    "competitionType": "SOFTWARE", //SOFTWARE, STUDIO, ALGORITHM
    "assetDTO": {
        "name": "",
        "productionDate": "" //2016-03-05T09:00:00-04
    },
    "projectHeader": {
        "id": -1,
        "tcDirectProjectId": -1,
        "projectSpec": {
            "projectSpecId": 0,
            "detailedRequirements": "These are the requirements.",
            "finalSubmissionGuidelines": "guidelines go here."
        },
        /*
        "projectMMSpecification": {
            "problemId": -1
        },
        */
        "prizes": [{
                "place": 1,
                "prizeAmount": 300,
                "prizeType": {
                    "id": 15,
                    "description": "Contest Prize"
                },
                "numberOfSubmissions": 1
            }
            /*, {
                        "place": 2,
                        "prizeAmount": 150,
                        "prizeType": {
                            "id": 15,
                            "description": "Contest Prize"
                        },
                        "numberOfSubmissions": 1
                    } */
        ],
        "properties": {
            "Billing Project": "0",
            "Confidentiality Type": "public",
            //            "Project Name": "",
            //            "First Place Cost": "450",
            //            "Payments": "300",
            //            "Second Place Cost": "150",
            //            "Review Cost": "1032",
            //            "Reliability Bonus Cost": "420",
            //            "DR points": "630",
            "Digital Run Flag": "Off",
            //            "Checkpoint Bonus Cost": "0",
            //            "Admin Fee": "0",
            //            "Spec Review Cost": "50",
            //            "Cost Level": "B",
            //            "Copilot Cost": "600",
            "Review Type": "COMMUNITY"
        },
        "projectCategory": {
            "id": 39, //CWD-- 38
            "name": "CODE", //CWD-- First2Finish
            "projectType": {
                "id": 2,
                "name": "Application"
            }
        },
        "tcDirectProjectName": "",
        //        "securityGroupId": 0
    },
    //    "directProjectMilestoneId": -1,
    "endDate": "", //2016-04-20T09:00:00-04
    //    "contestCopilotId": -1,
    "contestCopilotName": "",
    "technologies": [
        //        "2"
    ],
    "platforms": [
        //        "4"
    ],
    "hasMulti": false
};

module.exports = function() {
    return defaultChallenge;
};
