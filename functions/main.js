// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Dialogflow fulfillment getting started guide:
// https://dialogflow.com/docs/how-tos/getting-started-fulfillment

'use strict';

import * as functions from 'firebase-functions';
import { WebhookClient } from 'dialogflow-fulfillment';
import yelpApi from './src/yelp';

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

export default functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  const { parameters } = request.body.queryResult;
  console.log(parameters);

  function welcome (agent) {
    agent.add(`Welcome to my agent!`);
  }

  function fallback (agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function yelp (agent) {
    const { Food_Category : term, 'geo-city' : location } = parameters;
    console.log(`${term}, ${location}`);
    return yelpApi.search({term, location,limit:1})
      .then((data) => {
        const { name, rating, location: address } = data.jsonBody.businesses[0];
        agent.add(`Here's a suggestion for ${term} near ${location}`);
        agent.add(`${name} has ${rating} star ratings`);
        agent.add(`It is located at ${address.display_address}`);
        return;
      })
      .catch((err) => {
        agent.add(`Oops, something went wrong!: ${err}`)
        return;
      });
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Fulfillment.Yelp.Search', yelp);
  agent.handleRequest(intentMap);
});
