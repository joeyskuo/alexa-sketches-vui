'use strict';
var http = require('http');

exports.handler = function(event, context) {


	if(process.env.NODE_DEBUG_EN) {
	  console.log("Request:\n"+JSON.stringify(event,null,2));
	}

  var request = event.request;
  var session = event.session;
  let exitsound = "<audio src='https://s3.amazonaws.com/sketchesgame/exit.mp3'/>";

  if(!event.session.attributes) {
    event.session.attributes = {};
  }


  if (request.type === "LaunchRequest"){
    
    handleLaunchRequest(context, session);

  } else if (request.type === "IntentRequest") {
    
    if (request.intent.name === "GuessIntent" && event.session.attributes.GuessIntent !== true && event.session.attributes.HelpIntent !== true) {

      handleGuessIntent(request, context, session, false);

    } else if (request.intent.name === "GuessIntent"){

      handleGuessIntent(request,context,session, false);

    } else if (request.intent.name === "HelpIntent"){
      
      handleHelpIntent(request,context,session);

    } else if (request.intent.name === "AMAZON.StopIntent" || request.intent.name === "AMAZON.CancelIntent") {

      context.succeed(buildResponse({
      speechText: exitsound,
      endSession: true
      })
      );

    } else {

      throw "Unknown intent";
    
    }

  } else if (request.type === "SessionEndedRequest") {

  } else {
    context.fail("Unknown intent type");
  }
}

function buildResponse(options) {

  var response = {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>"+options.speechText+"</speak>"
      },

      shouldEndSession: options.endSession
    }
  };

  if(options.repromptText) {
    response.response.reprompt = {
      outputSpeech: {
       type: "SSML",
        ssml: "<speak>"+options.repromptText+"</speak>"
      }
    };
  }

  if(options.session && options.session.attributes) {
    response.sessionAttributes = options.session.attributes;
  }

  if(process.env.NODE_DEBUG_EN) {
    console.log("Response:\n"+JSON.stringify(response,null,2));
  }

return response;

}      

function handleGuessIntent(request, context, session, fin){
      let options = {};
      let guess = request.intent.slots.Guess.value;
      let rightsound = "<audio src='https://s3.amazonaws.com/sketchesgame/cor.mp3'/>";
      let wrongsound = "<audio src='https://s3.amazonaws.com/sketchesgame/incor.mp3'/>";
      console.log(request.intent.slots.Guess.value);
      options.session = session;
      options.endSession = fin;

      if(!session.attributes.HelpIntent){

        getJSON(function(json,err){
          if(err) {
            context.fail(err);
          // } else if (guess == "help") {
          //   options.speechText = `To play, a web-browser must be open at <prosody rate="90%">www.sketchesgame<say-as interpret-as="spell-out">.io</say-as> <break time="300ms"/>To send a guess, you can just state your guess.</prosody>`;
          //   options.speechText += `For example, you can say airplane, or <break strength="medium"/>guess airplane.`;
          //   options.speechText += `<break time="150ms"/><prosody rate="medium">Would you like to start playing,</prosody>`;
          //   options.session.attributes.HelpIntent = true;
          //   options.session.attributes.GuessIntent = false;
          //   context.succeed(buildResponse(options)); // send response and continue session
          } else if (guess == json.word) {
            options.speechText = rightsound + `${guess}` + " was correct! ";
            options.session.attributes.GuessIntent = true;
            context.succeed(buildResponse(options)); // send response and continue session
          } else if (json.time > 10) {
            options.speechText = wrongsound + " The answer was " + json.word;
            options.session.attributes.GuessIntent = true;
            context.succeed(buildResponse(options)); // send response and continue session
          } else {
            options.speechText = wrongsound;
            options.session.attributes.GuessIntent = true;
            context.succeed(buildResponse(options)); // send response and continue session
          }
        });
      } else {
            options.speechText = "Please answer with yes, no, or help.";
            options.endSession = false;
            options.session.attributes.HelpIntent = true;
            options.session.attributes.GuessIntent = false;
            context.succeed(buildResponse(options)); // send response and continue session
      }
}

function handleHelpIntent(request, context, session){
      let options = {};
      let resp = request.intent.slots.response.value;
      let wrongsound = "<audio src='https://s3.amazonaws.com/sketchesgame/incor.mp3'/>";

      options.session = session;

      if(resp == "help"){
            options.speechText = `To play, a web-browser must be open at <prosody rate="90%">www.sketchesgame<say-as interpret-as="spell-out">.io</say-as> <break time="300ms"/>To send a guess, you can just state your guess.</prosody>`;
            options.speechText += `For example, you can say airplane, or <break strength="medium"/>guess airplane.`;
            options.speechText += `<break time="150ms"/><prosody rate="medium">Would you like to start playing,</prosody>`;
            options.endSession = false;
            options.session.attributes.HelpIntent = true;
            options.session.attributes.GuessIntent = false;
            context.succeed(buildResponse(options)); // send response and continue session
      } else if(session.attributes.HelpIntent) {
            if (resp == "yes" || resp == "start") {
              options.speechText = "Starting game. Listening for guesses.";
              options.session.attributes.GuessIntent = true;
              options.session.attributes.HelpIntent = false;
              options.endSession = false;
              context.succeed(buildResponse(options)); // send response and continue session
            } else if (resp == "no") {
              options.speechText = "Goodbye,";
              options.endSession = true;
              context.succeed(buildResponse(options)); // send response and continue session
            } else if (resp == "repeat") {
              options.speechText = `To play, a web-browser must be open at <prosody rate="90%">www.sketchesgame<say-as interpret-as="spell-out">.io</say-as> <break time="300ms"/>To send a guess, you can just state your guess.</prosody>`;
              options.speechText += `For example, you can say airplane, or <break strength="medium"/>guess airplane.`;
              options.speechText += `<break time="150ms"/><prosody rate="medium">Would you like to start playing,</prosody>`;
              options.endSession = false;
              options.session.attributes.HelpIntent = true;
              options.session.attributes.GuessIntent = false;
              context.succeed(buildResponse(options)); // send response and continue session
            } else {
              options.speechText = "Please answer with yes, no, or repeat.";
              options.endSession = false;
              options.session.attributes.HelpIntent = true;
              options.session.attributes.GuessIntent = false;
              context.succeed(buildResponse(options)); // send response and continue session
            }
      } else {
          options.speechText = wrongsound;
          options.endSession = false;
          options.session.attributes.GuessIntent = true;
          context.succeed(buildResponse(options)); // send response and continue session
      }
}


function handleLaunchRequest(context,session){
    let options = {};
    options.session = session;

        getJSON(function(json,err){
          if(err) {
            context.fail(err);
          } else {
				    options.speechText = "Connected to sketches game. Currently sketching "+ json.word + `<break time="100ms"/>`;
				    options.speechText += "Guesses can be sent by just saying " + json.word + `<break strength="medium"/> or <break strength="medium"/> guess ` + json.word;
				    options.speechText += `<break time="150ms"/> I will keep listening for new guesses. Would you like to start playing, `;
				    options.endSession = false;
				    options.session.attributes.HelpIntent = true;
				    context.succeed(buildResponse(options)); // send response to user
          }
        });
}


function getJSON(callback) {
  var url = "http://sketchesgame.herokuapp.com/";
  var req = http.get(url, function(res) {

    var body = "";


    res.on('data', function(chunk){ // res = response
      body += chunk;
    });

    res.on('end', function(){ // end of chunks

      body = body.replace(/\\/g,'');
      var json = JSON.parse(body);
      callback(json);

    });

  });

  req.on('error', function(err) {
    callback('',err);
  });
}
