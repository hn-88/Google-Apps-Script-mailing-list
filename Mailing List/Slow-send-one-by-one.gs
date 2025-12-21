

/**
 * Polls for sent emails and emails unsent emails.
 *
 * @frequency This task should run every 5 minutes, with initial emails being sent only once an hour.
 */

const contactemail = "planning@sssvv.org";
const currentdeploymentid ='AKfycbwhFry3M60sIVUs3o905qJRdwb_SjKGk3oSFozGIIx0JWKqWiBAXMkAgSNp39E5ZmCniw';
var subject = 'SSSVV Swayam reminder';
const signupwebsite = '<a href="https://swayam.srisathyasaividyavahini.org/" target="_blank">https://swayam.srisathyasaividyavahini.org/</a>';
const sendername = 'Swayamplus SSSVV';
var body = '<h3>Heading</h3><p>First paragraph</p>'
          + '</p><br><br>\n'
         +  '<p><small>You have received this email due to signing up at '+signupwebsite+'.</small></p>'
         +  '<p><small>If you do not wish to get these emails, please reply to this email stating you would like to unsubscribe, or use the link below to unsubscribe. </small></p>\n';

/////////////////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION
const LOG_SHEET_NAME = 'lastsent';
const DATA_SHEET_NAME = 'Emails'; // Name of the sheet containing email, subject, body
const TIME_ZONE = Session.getScriptTimeZone();

/**
 * 1. Setup the Trigger
 * Run this function ONCE manually to start the 5-minute timer.
 */
function createTimeTrigger() {
  // Clear existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  
  // Create a new trigger running every 5 minutes
  ScriptApp.newTrigger('checkAndProcessQueue')
    .timeBased()
    .everyMinutes(5)
    .create();
    
  console.log("Trigger created. Script will run every 5 minutes.");
}

/**
 * Main Logic Function called by the Trigger
 */
function checkAndProcessQueue() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  const dataSheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!logSheet || !dataSheet) {
    console.error("Missing required sheets. Please check sheets exist.");
    return;
  }

  // 1. Check the last sent row and time
  // We assume Cell A1 = Last Row Number, Cell B1 = Last Sent Timestamp
  let lastRow = parseInt(logSheet.getRange(1, 1).getValue());
  let lastTimeValue = logSheet.getRange(1, 2).getValue();
  
  // Handle first run or empty values
  if (isNaN(lastRow)) lastRow = 1; // first row of Emails sheet is headers
  
  const now = new Date();
  let lastTime = new Date(lastTimeValue);
  
  // If lastTime is invalid (empty cell), assume it was a long time ago
  if (lastTime.toString() === 'Invalid Date') {
    lastTime = new Date(0); 
  }

  // Calculate difference in Minutes
  const diffInMs = now.getTime() - lastTime.getTime();
  const diffInMins = diffInMs / (1000 * 60);

  console.log(`Current Status: Last Row: ${lastRow}, Mins since last send: ${diffInMins.toFixed(2)}`);

  // Determine if we should send based on logic
  let shouldSend = false;

  // LOGIC GATES
  if (lastRow < 10) {
    // Condition 2: < 10, wait > 60 minutes (1 hour)
    if (diffInMins > 60) shouldSend = true;
    else console.log("Waiting: Need 60 mins gap for rows < 10");
  } 
  else if (lastRow >= 10 && lastRow < 100) {
    // Condition 3: 10-99, wait > 15 minutes
    if (diffInMins > 15) shouldSend = true;
    else console.log("Waiting: Need 15 mins gap for rows 10-100");
  } 
  else if (lastRow >= 100 && lastRow < 400) {
    // Condition 4: 100-399, wait > 10 minutes
    if (diffInMins > 10) shouldSend = true;
    else console.log("Waiting: Need 10 mins gap for rows 100-400");
  } 
  else if (lastRow >= 400) {
    // Condition 5: > 400, send immediately (limited by 5 min trigger)
    shouldSend = true;
  }

  // EXECUTION
  if (shouldSend) {
    const nextRow = lastRow + 1;
    
    // Check if data actually exists for the next row
    // Assuming Data Sheet Structure: Col A=Email, Col B=Subject, Col C=Body
    // Adjust logic if your headers are in Row 1 (so data starts row 2)
    // Here assuming nextRow maps directly to spreadsheet row number
    
    if (nextRow > dataSheet.getLastRow()) {
      console.log("End of list reached.");
      // send an email to contactemail
      try {
      MailApp.sendEmail({
        to: contactemail,
        subject: "End of list reached",
        htmlBody: "The mailing list has completed sending. Turning off the time trigger ..."
      });
      } catch (e) {
        console.error("Failed to send email to " + emailid + ": " + e.message);
      }
      // remove the time trigger

      // Deletes all triggers in the current project.
      const triggers = ScriptApp.getProjectTriggers();
      for (let i = 0; i < triggers.length; i++) {
        ScriptApp.deleteTrigger(triggers[i]);
      }

      return; 
    }

    const emailId = dataSheet.getRange(nextRow, 1).getValue(); // Col A
    //const subject = dataSheet.getRange(nextRow, 2).getValue(); // Col B
    //const body    = dataSheet.getRange(nextRow, 3).getValue(); // Col C
    

    
    if (emailId) {
      // Send the email
      sendEmailToListmember(nextRow, subject, body);

      // Update the Log Sheet
      logSheet.getRange(1, 1).setValue(nextRow);
      logSheet.getRange(1, 2).setValue(now);
      
      console.log(`Email sent to row ${nextRow}`);
    } else {
      console.log(`Row ${nextRow} has no email address. Skipping update to prevent stall.`);
      // Optional: Increment row anyway so it doesn't get stuck forever
      logSheet.getRange(1, 1).setValue(nextRow);
    }
  }
}

/**
 * Helper function to send email
 */
function sendEmailToListmember(emailidrow, subject, body) {

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  var recipient   = sheet.getRange(emailidrow, 1).getValue(); // Col A
  var Bval        = sheet.getRange(emailidrow, 2).getValue(); // Col B
  var hash        = sheet.getRange(emailidrow, 3).getValue(); // Col C
  var n = emailidrow;
  
  //Logger.log(recipient)
  // send email only if Bval is 'confirmed'
  if(Bval=='confirmed') {
    try {
      GmailApp.sendEmail(recipient, subject, '', {
        to: recipient,
        subject: subject,
        htmlBody: body+addunsublink(recipient, hash),
        name: sendername,
      });
    } catch (e) {
      console.error("Failed to send email to " + emailid + ": " + e.message);
    }
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////

function main() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RSS');
    var RSSvals = sheet.getRange("A1:C1").getValues();
     
    // https://developers.google.com/apps-script/reference/utilities/utilities#formatDate(Date,String,String)
    var formattedDate = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
    
    var RSS_URL = RSSvals[0][0]+RSSvals[0][1]+RSSvals[0][2],
        jsonDoc = getFeedAsJson(RSS_URL),
        // modified using https://github.com/hn-88/bloggerToEbook/blob/main/Code.gs        
        body = '<h3>Posts updated this week</h3><h4>(May contain links to posts with minor edits also)</h4>\n',
        subject;
        
    body += '<p>\n';

    for ( i in jsonDoc.feed.entry) {
      //Logger.log(jsonDoc.feed.entry[i].title.$t);
      //Logger.log(jsonDoc.feed.entry[i].summary.$t);
      // using https://stackoverflow.com/questions/59251914/how-to-get-the-data-from-the-feed-of-blogspot
      // for the link
      //Logger.log(jsonDoc.feed.entry[i].link.pop().href)
      body += '<a href="' + jsonDoc.feed.entry[i].link.pop().href
           + '" target="_blank">'
           + jsonDoc.feed.entry[i].title.$t
           + '</a> <br>\n';      
    }
    body += '</p><br><br>\n'
         +  '<p><small>You have received this email due to signing up at '+signupwebsite+'.</small></p>'
         +  '<p><small>If you do not wish to get these emails, please reply to this email stating you would like to unsubscribe, or use the link below to unsubscribe. </small></p>\n';
             
    subject = "Updates this week";
        
    sendEmailToList(subject, body);

    sheet.getRange("B1").setValue(formattedDate);
    
}


function getFeedAsJson(url) {
    var jsonText = UrlFetchApp.fetch(url).getContentText();
    
    // modified using https://github.com/hn-88/bloggerToEbook/blob/main/Code.gs
    return JSON.parse(jsonText);
}

/**
* Sends an email to yourself
*
* @param {String} subject - email subject line
* @param {String} body - HTML markup to be used as body content for the email
*/

function sendEmailToSelf(subject, body) {
    var recipient = Session.getActiveUser().getEmail();

    GmailApp.sendEmail(recipient, subject, "", {
        htmlBody: body
    });
}

/**
* Sends an email to the list
*
* @param {String} subject - email subject line
* @param {String} body - HTML markup to be used as body content for the email
*/

function sendEmailToList(subject, body) {

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');
    // via https://stackoverflow.com/questions/14991030/get-value-in-one-column-in-spreadsheet-using-google-apps-script
    var Avals = sheet.getRange("A1:A").getValues();
    var Bvals = sheet.getRange("B1:B").getValues();
    var Cvals = sheet.getRange("C1:C").getValues();
    var numberOfAVals = Avals.filter(String).length;

    //Logger.log(numberOfAVals);
    for (n=0;n<numberOfAVals;n++) {
      var recipient = Avals[n];
      var hash = Cvals[n];
      //Logger.log(recipient)
      // send email only if Bval is 'confirmed'
      if(Bvals[n]=='confirmed') {
        GmailApp.sendEmail(recipient, subject, "", {
            htmlBody: body+addunsublink(recipient, hash)
        });
      }
    }
}

/**
* Returns an unsubscribe link as HTML which can be appended to body
*
* @param {String} email - email id of recipient
* @param {String} hash - unique unsubscribe hash
*/
function addunsublink(email, hash) {
  
  linkval = 'https://script.google.com/macros/s/'
            + currentdeploymentid
            +  '/exec?email='
            + encodeURIComponent(email)
            + '&unsubscribe_hash='
            + hash
            + '&s=unsub';
  linktext = '<p><small><a href="'
           + linkval
           + '">Unsubscribe</a></small></p> '
  Logger.log(linktext);
  return linktext;
}

function checkQuota() {
  Logger.log(MailApp.getRemainingDailyQuota());
}

// the following are via
// https://ravgeetdhillon.medium.com/add-unsubscribe-link-in-emails-using-google-apps-script-475c938b3e9f

function getMD5Hash(value) {
  value = value + generateRandomString(9); // added this
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,
                                         value,
                                         Utilities.Charset.UTF_8);
  let hash = '';
  for (i = 0; i < digest.length; i++) {
    let byte = digest[i];
    if (byte < 0) byte += 256;
    let bStr = byte.toString(16);
    if (bStr.length == 1) bStr = '0' + bStr;
    hash += bStr;
  }
  //Logger.log(hash)
  return hash;
}

function generateRandomString(length) {
  const randomNumber = Math.pow(36, length + 1) - Math.random() * Math.pow(36, length);
  const string = Math.round(randomNumber).toString(36).slice(1);
  return string;
}

// This doPost implements user submitting emails to subscribe
function doPost(e) {
  const email = e.parameter['email'];
  const s = e.parameter['s'];
  const bot = e.parameter['botname'];

  if (bot != "") {
    return HtmlService.createHtmlOutput('<p>Bot submission blocked. Please contact '+contactemail+' if the email was correct.</p>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  if (s=='sub') {
  const returnvalue = subscribeUser(email);
  if (returnvalue == "emailfail") {
    return HtmlService.createHtmlOutput('<p>Please submit a valid email. Please contact '+contactemail+' if the email was correct.</p>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (returnvalue == "success") {
    return HtmlService.createHtmlOutput('<p>You will be sent a confirmation email.</p>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (returnvalue == "confirmed") {
    return HtmlService.createHtmlOutput('<p>You are already subscribed. Please check your spam folder.</p>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (returnvalue == "unconfirmed") {
    return HtmlService.createHtmlOutput('<p>Confirmation mail was already sent to you. Please check your spam folder or contact '+contactemail+'</p>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (returnvalue == "unsubscribed") {
    return HtmlService.createHtmlOutput('<p>You had unsubscribed earlier. Please contact '+contactemail+' to re-subscribe.</p>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  //else 
  return HtmlService.createHtmlOutput('<p>There was an error. Please contact '+contactemail+'</p>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  
  
  }
}


// This doGet implements unsubscribe if s=='unsub'
// If s == '', it returns the subscription form

function doGet(e) {
  const email = e.parameter['email'];
  const s = e.parameter['s'];

  if (s=='unsub') {
  const unsubscribeHash = e.parameter['unsubscribe_hash'];
  const success = unsubscribeUser(email, unsubscribeHash);
  if (success) return ContentService.createTextOutput().append('You have unsubscribed.');
  return ContentService.createTextOutput().append('Failed');
  }
  
  if (s=='conf') {
  const subscribeHash = e.parameter['subscribe_hash'];
  const returnvalue = confirmUser(email, subscribeHash);
  if (returnvalue == "success") return ContentService.createTextOutput().append('Thank you for confirming. You will start receiving email updates.');
  
  }
  // the following will be invoked only if
  // neither sub nor unsub was invoked
  // or if either of them failed
  
  // return the subscription form
  // https://developers.google.com/apps-script/guides/html/best-practices
  return HtmlService.createTemplateFromFile('SubForm')
      .evaluate()
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  
}


function unsubscribeUser(emailToUnsubscribe, unsubscribeHash) {  
  // get the active sheet which contains our emails
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  // get the data in it
  const data = sheet.getDataRange().getValues();
  
  /*
  // get headers
  const headers = data[0];

  // get the index of each header
  const emailIndex = headers.indexOf('email');
  const unsubscribeHashIndex = headers.indexOf('unsubscribe_hash');
  const subscribedIndex = headers.indexOf('subscribed');
  */
  const emailIndex = 0;
  const unsubscribeHashIndex = 2;
  const subscribedIndex = 1;
  
  // iterate through the data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const hash = row[unsubscribeHashIndex];

    // if the email and unsubscribe hash match with the values in the sheet
    // then update the subscribed value to 'no'
    if (emailToUnsubscribe === email && unsubscribeHash === hash) {
      sheet.getRange(i+1, subscribedIndex+1).setValue('no');
      return true;
    }
  }
}

function confirmUser(emailtosub, subhash) {  
  // get the active sheet which contains our emails
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  // get the data in it
  const data = sheet.getDataRange().getValues();
  
  const emailIndex = 0;
  const subscribeHashIndex = 2;
  const subscribedIndex = 1;
  
  // iterate through the data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const hash = row[subscribeHashIndex];

    // todo - add check to give additional message if user had unsubscribed earlier
    // or if there is something else wrong

    // if the email and hash match with the values in the sheet
    // then update the subscribed value to 'confirmed'
    if (emailtosub === email && subhash === hash) {
      sheet.getRange(i+1, subscribedIndex+1).setValue('confirmed');
      return 'success';
    }
  }
}

function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  if (!re.test(email)) {
    return false;
  } else {
    // the method below returns true only if the email has a google account.
    // var testSheet = SpreadsheetApp.openById('1HNIWfsYioePwU6YZJfFITk6qY');
    // try {
    //   testSheet.addViewer(email);
    // } catch(e) {
    //   return false;
    // }
    // testSheet.removeViewer(email);
    return true;
  }
}



// The following function adds email subscribers. It 
// 1. checks if the email being entered for subscription already exists
// 2. If already exists, checks if confirmed
// 3. If doesn't exist, adds and returns success.
// 4. Other possible return values are 
//     confirmed, unconfirmed, unsubscribed

function subscribeUser(emailToSubscribe) {  
  // first check if email is valid
  // https://stackoverflow.com/questions/4009085/checking-if-an-email-is-valid-in-google-apps-script
  if (!validateEmail(emailToSubscribe)) {
    return 'emailfail';
  }

  // get the active sheet which contains our emails
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  // get the data in it
  const data = sheet.getDataRange().getValues();
  
  const emailIndex = 0;
  const unsubscribeHashIndex = 2;
  const subscribedIndex = 1;
  
  // iterate through the data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const issubscribed = row[subscribedIndex];

    // if the email matches with the values in the sheet
    // then update the subscribed value to 'no'
    if (emailToSubscribe === email) {
      if (issubscribed === 'confirmed') {
        return 'confirmed';
      }
      if (issubscribed === 'no') {
        return 'unsubscribed';
      }
      if (issubscribed === '') {
        return 'unconfirmed';
      }  
    }

  }
  // emailToSubscribe is not found, so append it
  // add the hash and send a confirmation email
  var subscribe_hash = getMD5Hash(emailToSubscribe.trim().toLowerCase());
  var row =  [emailToSubscribe, "", subscribe_hash];
  sheet.appendRow(row);
  sendConfirmationEmail(emailToSubscribe,subscribe_hash);
  return 'success';
}

function confirmAndHashEmails() {
  const SHEET_NAME = 'Emails'; // Change this to your actual sheet name
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  // Get the last row with data
  const lastRow = sheet.getLastRow();
  
  // Check if there is data (assuming row 1 is headers, so we need > 1)
  if (lastRow < 2) {
    Logger.log("No data found to process.");
    return;
  }
  
  // 1. READ: Get all data from Row 2 down to the last row, spanning 3 columns (A, B, C)
  // range(startRow, startCol, numRows, numCols)
  const range = sheet.getRange(2, 1, lastRow - 1, 3);
  const data = range.getValues();
  
  // 2. PROCESS: Iterate through the data in memory
  for (let i = 0; i < data.length; i++) {
    const email = data[i][0]; // Column A (Index 0)
    
    // Only process if there is an email present
    if (email) {
      // Set Column B (Index 1) to "confirmed"
      data[i][1] = "confirmed";
      
      // Set Column C (Index 2) to the MD5 hash
      // We trim and lowercase the email for standard hash consistency
      data[i][2] = getMD5Hash(email.trim().toLowerCase());
    }
  }
  
  // 3. WRITE: Update the sheet in one single operation
  range.setValues(data);
  Logger.log("Processed " + data.length + " rows.");
}


function sendConfirmationEmail(emailToSubscribe,subscribe_hash) { 
  var subject = 'Confirmation required - update emails';
  var sublink = 'https://script.google.com/macros/s/'+currentdeploymentid+'/exec?email='+encodeURIComponent(emailToSubscribe)+'&s=conf&subscribe_hash='+subscribe_hash;
  var body = '<h3>Did you sign up for updates?</h3>' 
  +  '<p>You have received this confirmation email because you, (or someone else on your behalf) '
  + 'has signed up your email at '+signupwebsite+'.</p>\n'
  +  '<p>If you do not wish to receive these emails, you can just ignore this email. '
  + 'But if you wish to receive the email updates, please click on the confirm button below.</p>\n'
  + '<p>(Please note: this will NOT WORK if you are logged in to multiple google accounts - <br>'
  + 'a workaround in such cases is to right-click and open the link below in an incognito window.)</p>\n'
  + '<a href="' + sublink +'"><button type="button">I confirm - send me the emails please!</button></a>'
         +  '</p><br><br>\n'
         +  '<p><small>You have received this email due to signing up at '+signupwebsite+'.</small></p>';         

    GmailApp.sendEmail(emailToSubscribe, subject, "", {
        htmlBody: body
    });
}


function updatehashes() {  
  // get the active sheet which contains our emails
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  // get the data in it
  const data = sheet.getDataRange().getValues();
  
  /*
  // get headers
  const headers = data[0];

  // get the index of each header
  const emailIndex = headers.indexOf('email');
  const unsubscribeHashIndex = headers.indexOf('unsubscribe_hash');
  const subscribedIndex = headers.indexOf('subscribed');
  */
  const emailIndex = 0;
  const unsubscribeHashIndex = 2;
  const subscribedIndex = 1;
  
  // iterate through the data 
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const hash = getMD5Hash(email.trim().toLowerCase());
    sheet.getRange(i+1, unsubscribeHashIndex+1).setValue(hash);    
  }
}
