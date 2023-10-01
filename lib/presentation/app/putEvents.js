import {PersonalizeEventsClient, PutEventsCommand} from
        "@aws-sdk/client-personalize-events";


const config = {
    region: process.env.REGION
}
const client = new PersonalizeEventsClient(config);

export const handler = async (event, context) => {
    console.log('Input Body', JSON.stringify(event, null, 2));
    let body;
    let result = []

        let record = event.Records.pop()
        console.log('Record', record)
        let payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
        body = JSON.parse(payload)
    const userId = body.userId
    const interactions = body.interactions
    console.log('interactions interactions:', interactions);

    try {
        let response;
            for (let i = 0; i < interactions; i++) {

                let itemId=  body.itemId
                let eventType = body.eventType;
                let sessionId = generateSessionId(12)
                let sentAt = new Date(generateDate(body.dateFrom, body.dateTo))
                const input = {
                    trackingId: body.trackingId,
                    userId: userId,
                    sessionId: sessionId,
                    eventList: [
                        {
                            eventType: eventType,
                            itemId: itemId,
                            sentAt: sentAt,
                            properties: {}
                        },
                    ],
                };

                console.log(`Sending ${i} event - itemId ${itemId} - UserId ${userId} - Event type ${eventType}`)
                const command = new PutEventsCommand(input);
                try {
                    response = await client.send(command);
                }catch (e) {
                    return {
                        statusCode: 500,
                        body: JSON.stringify(e)
                    }
                }

                let output = {
                    itemId : itemId,
                    eventType : eventType,
                    userId: userId,
                    response: response
                }

                result.push(output)
                console.log(`Event put successfully ${JSON.stringify(response)} `)

            }
    }catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify(e)
            }
        }

    return  {
        statusCode: 200,
        body: JSON.stringify(result)
    }

};

const generateDate = (dateFrom, dateTo) => {
    const startDate = new Date(dateFrom).getTime();
    const endDate = new Date(dateTo).getTime();
    return Math.floor(Math.random() * (endDate - startDate)) + startDate;
}

const generateSessionId = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}
