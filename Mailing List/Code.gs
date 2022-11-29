// Initial commit from https://gist.github.com/roblaplaca/11025c3e0cae33f3fc0b
/**
 * Polls for XKCD's latest post and emails it daily (only if new).
 *
 * @frequency This task should run daily.
 */

function main() {
    var RSS_URL = "http://xkcd.com/rss.xml",
        xmlDoc = getRSSFeedAsXML(RSS_URL),
        channel = xmlDoc.getElement().getElement("channel"),
        firstItem = channel.getElement("item"),
        pubDateAsString = firstItem.getElement("pubDate").getText(),
        body,
        subject;

    if( wasComicPublishedToday(pubDateAsString) ) {
        subject = "XKCD : " + firstItem.getElement("title").getText();
        body = firstItem.getElement("description").getText();
        body = appendAltToBody(body);

       sendEmailToSelf(subject, body);
    }
}

/**
* The alt tag contains a subtitle for the comic which is often funny
* This method extracts the value and appends it to the email body
*/

function appendAltToBody(body) {
    var altTagRegex = /alt="(.*)"/,
        matches = altTagRegex.exec(body);
  
    return (matches.length === 0) ? body : body + "<br /><br /> " + matches[1];
}

/**
* Retrieves RSS feed and returns it as an XML object
* which can be traversed.
*
* @param {String} url - url of RSS feed to retrieve
* @returns {XMLObject}
*/

function getRSSFeedAsXML(url) {
    var xmlText = UrlFetchApp.fetch(url).getContentText();
    
    return Xml.parse(xmlText, true);
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
* Determines if publish date was more than a day ago
*
* @param {String} pubDateAsString - Date string of a given post
* @returns {Boolean} whether or not the comic was published on the current day
*/

function wasComicPublishedToday(pubDateAsString) {
    var now = new Date(),
        pubDate = new Date(pubDateAsString),
        differenceInDays = ((now.getTime() - pubDate.getTime()) / 1000 / 60 / 60 / 24);

    return (differenceInDays &lt;= 1);
}
