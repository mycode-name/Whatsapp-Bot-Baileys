const fs = require("fs/promises");
const date = new Date();

class ParticipantsUpdates {
  #getText;
  #sendMessage;
  #prefixUpdate;
  #prefixTask;
  #prefixCancel;
  #prefixChange;

  constructor(config = {}) {
    this.#prefixUpdate = config.prefix || "!updates";
    this.#prefixTask = config.prefix || "!task";
    this.#prefixCancel = config.prefix || "!cancel";
    this.#prefixChange = config.prefix || "!change";
  }

  init(socket, getText, sendMessage) {
    this.#getText = getText;
    this.#sendMessage = sendMessage;
  }

  #milisec(datetime){
    const date = Date.now();
    const reminderTime = Date.parse(datetime);

    return (reminderTime-date-(5*60*60+30*60)*1000);
  }

  #reminder(datetime, key, message, text){
    const mentions = [`${text.slice(7, 19)}@s.whatsapp.net`];

    const timeOutId = setTimeout(() => {
      this.#sendMessage(
        key.remoteJid,
          {text: `Reminder @${text.slice(7, 19)}\nWhat is your update on the tasks`, mentions},   // !task @919939062170@s.whatsapp.net
        { quoted: { key, message } }
      );
    }, this.#milisec(datetime));
  
    return timeOutId;
  }

  async process(key, message) {
    const text = this.#getText(key, message);

    const items = text.split(" ");

    let datetime = '2024-03-27T20:00:00';

    let reminders;
    const timeOutIdData = await fs.readFile('/home/node/app/plugins/reminderTime.json', { encoding: 'utf8' });
    reminders = JSON.parse(timeOutIdData);

    if (text.toLowerCase().startsWith(this.#prefixTask)){
      let timeOutId = this.#reminder(datetime, key, message, text);

      reminders[timeOutId] = [key, message];

      this.#sendMessage(
        key.participant,
        {text: `${timeOutId}\nA reminder is set for this message, and this reminder message will be sent automatically after ${Math.round(this.#milisec(datetime)/(3600*1000))==0? Math.round(this.#milisec(datetime)/(60*1000)) + ' min': Math.round(this.#milisec(datetime)/(3600*1000)) + ' hr ' + Math.round((this.#milisec(datetime)/(60*1000))%60) + ' min'}\n\nIf you want to change the reminder time, please type\n!change [reminder ID] [Year]-[Month]-[Day]T[Hours]:[Minutes]:[Seconds]`},
        { quoted: { key, message } }
      );
    } else if(text.toLowerCase().startsWith(this.#prefixCancel)){
      let timeOutId = items[1];
      clearTimeout(timeOutId);
      delete reminders[timeOutId];

      this.#sendMessage(
        key.remoteJid,
        {
          text: `Reminder with ID ${timeOutId} is cancelled.`,
        },
        { quoted: { key, message } }
      );
    } else if(text.toLowerCase().startsWith(this.#prefixChange)){
      let oldTimeOutId = items[1];

      let newTimeOutId;
      for (let timeOutId in reminders) {
        if (timeOutId == oldTimeOutId){
          newTimeOutId = this.#reminder((items[2]), reminders[timeOutId][0], reminders[timeOutId][1], this.#getText(reminders[timeOutId][0], reminders[timeOutId][1]));
        }
      }
      clearTimeout(oldTimeOutId);
      delete reminders[oldTimeOutId];

      this.#sendMessage(
        key.remoteJid,
        {text: `Older Reminder with ID ${oldTimeOutId} is cancelled.\n\nAnd a new reminder with ID ${newTimeOutId} is created for this message, and this reminder message will be sent automatically after ${Math.round(this.#milisec(items[2])/(3600*1000))==0? Math.round(this.#milisec(items[2])/(60*1000)) + ' min': Math.round(this.#milisec(items[2])/(3600*1000)) + ' hr ' + Math.round((this.#milisec(items[2])/(60*1000))%60) + ' min'}`},
        { quoted: { key, message } }
      );
    } else if(text.toLowerCase().startsWith(this.#prefixUpdate)){
      let shouldCancelId, oldText;
      for (let timeOutId in reminders) {
        oldText = this.#getText(reminders[timeOutId][0], reminders[timeOutId][1]);
        if (oldText.includes(`@${key.participant.replace('@s.whatsapp.net', '')}`)){
          shouldCancelId = timeOutId;
          console.log("Gamezzzzzzz");
        }
      };
      
      this.#sendMessage(
        reminders[shouldCancelId][0].participant,
        {
          text: `As the participant have provided the update, if you want to cancel his reminder (timeOutId: ${shouldCancelId}), please type\n\n!cancel [timeOutId]`,
        },
        { quoted: { key, message } }
      );
    } else{
      return;
    }

    fs.writeFile('/home/node/app/plugins/reminderTime.json', JSON.stringify(reminders));
  }
}

module.exports = ParticipantsUpdates;
  