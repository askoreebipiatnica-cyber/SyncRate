import * as fs from 'fs';

const ICON_16 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMElEQVR42mP8z8BQD8SMyMAMasAmgCsYmIEYgJoGgKshH6IOfB0YVDAUDFgBBAAA//8D6gIDT78/0gAAAABJRU5ErkJggg==';

try {
  const current16 = fs.readFileSync('extension/icons/icon16.png').toString('base64');
  console.log("Current extension/icons/icon16.png matches ICON_16:", current16 === ICON_16);
  if (current16 !== ICON_16) {
    console.log("Current is different! Base64:");
    console.log(current16);
  }
} catch (e: any) {
  console.log("Error checking:", e.message);
}
