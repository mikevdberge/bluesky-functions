"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    //exports.handler = async (event, context) => {
    if (!event.body || event.httpMethod !== 'POST') {
        console.log("Invalid request body: ", event.body);
        console.log("Invald HTTP Method:", event.httpMethod);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({
                status: 'invalid-method'
            })
        };
    }
    const data = JSON.parse(event.body);
    if (!data.text) {
        console.error('Required information is missing.');
        console.log("Invalid request body: ", event.body);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({
                status: 'missing-information'
            })
        };
    }
    //const subject = event.queryStringParameters.name
    const body = JSON.parse(event.body);
    //get BlueSky facets (JSON) from the provided text
    let facet = detectFacets(body.text);
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "text": body.text, facet }),
    };
});
exports.handler = handler;
function detectFacets(text) {
    const facets = [];
    // URL detection regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;
    // Detect URLs
    while ((match = urlRegex.exec(text)) !== null) {
        facets.push({
            index: {
                byteStart: match.index,
                byteEnd: match.index + match[0].length
            },
            features: [{
                    $type: "app.bsky.richtext.facet#link",
                    uri: match[0]
                }]
        });
    }
    // Mention detection regex (handles both @handle and @handle.bsky.social formats)
    const mentionRegex = /@([a-zA-Z0-9.-]+(?:\.[a-zA-Z0-9.-]+)*)/g;
    // Detect mentions
    while ((match = mentionRegex.exec(text)) !== null) {
        const handle = match[1];
        // In a real app, you'd want to validate/resolve the DID
        const temporaryDid = `did:plc:${Buffer.from(handle).toString('hex')}`;
        facets.push({
            index: {
                byteStart: match.index,
                byteEnd: match.index + match[0].length
            },
            features: [{
                    $type: "app.bsky.richtext.facet#mention",
                    did: temporaryDid
                }]
        });
    }
    // Sort facets by start index
    return facets.sort((a, b) => a.index.byteStart - b.index.byteStart);
}
