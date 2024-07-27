# [EttyDB](https://etty-db.vercel.app/)

EttyDB is a Remote Database Management and Integration Service that allows you to manage your website's database entries using Telegram. With EttyDB, you can conveniently create, edit, and synchronize database entries directly from your mobile device and seamlessly integrate them into your website. It simplifies database management by leveraging Telegram as an interface.

## How it Works

- **Telegram Integration**: Use our Telegram bots (`EttyDB` and `EttyFetch`) to manage database entries through a dedicated Telegram channel.

- **Website Integration**: Obtain a script tag by providing your Telegram channel ID on our platform. Include this script tag in your website to display and update database entries in real-time.

- **Real-Time Synchronization**: Any modifications made to database entries via Telegram are instantly reflected on your website post reload, ensuring up-to-date content.

## Usage

- Refer to our documentation below for detailed instructions on setting up and integrating EttyDB with your website.
- Here's the link to the video on how to setup EttyDB and its usage! - [Link](https://youtu.be/C5m9GFdL8T0)

## Benefits

- **Remote Accessibility**: Manage your database entries conveniently from Telegram, accessible from anywhere.
  
- **Seamless Integration**: Integrate database content into your website effortlessly using provided script tags.
  
- **Real-Time Updates**: Ensure consistency between database entries managed via Telegram and their display on your website.


## Getting Started

### 1. Create a Telegram Channel

Set up a Telegram channel to manage your database entries:

- Open Telegram Desktop and create a new channel.
- ![image](https://github.com/stktyagi/EttyDB/blob/main/images/Screenshot%202024-07-23%20201722.png)
  
- Make sure your channel is private to make sure your site data is private to you.
- ![image](https://github.com/stktyagi/EttyDB/blob/main/images/2.png)
  
- Start [`EttyDB`](https://web.telegram.org/k/#@EttyCDN_bot) and [`EttyFetch`](https://web.telegram.org/k/#@EttyFetch_bot) bots by /start command on their chat.
- Add [`EttyDB`](https://web.telegram.org/k/#@EttyCDN_bot) and [`EttyFetch`](https://web.telegram.org/k/#@EttyFetch_bot) bots as administrators to your channel.
  
- ![image](https://github.com/stktyagi/EttyDB/blob/main/images/3.png)
  
- ![image](https://github.com/stktyagi/EttyDB/blob/main/images/4.png)

- Click on Add Administrator and add both bots like so.
- ![image](https://github.com/stktyagi/EttyDB/blob/main/images/5.png)



### 2. Obtain Channel ID

Copy the Telegram channel ID from the URL of your channel:

- Go to Telegram Web and navigate to your channel.
- you could observe a url of this format https://web.telegram.org/k/#-1234567890.
- Copy the channel ID from the URL (e.g., `1234567890`) and paste it on our [website](https://etty-db.vercel.app/).

### 3. Integrate with Your Website

Start integrating your database entries into your website:

- After pasting you will receive the integration script tag from our platform.
- Include the provided script tag in your website's HTML headers.

### 4. Start Managing

Begin managing your database entries through Telegram (Store, Fetch, Update, Delete):

- **Store**: Create HTML tags on your website to capture user input. Add classes in the specified format and include the `gatherInfo()` function in your submit button. Make sure to add a placeholder to not get empty type value on telegram.
 Example:
```html 
    <input type="text" class="userInput" placeholder="username" />
    <input type="password" class="userInput" placeholder="password" />
    <input type="email" class="userInput" placeholder="email" />
    <button onclick="gatherInfo()">Submit</button>
```
Example format received:
[{"id":"1721314347250","type":"username","value":"username_value"},{"id":"1721314347250","type":"password","value":"ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb"},{"id":"1721314347250","type":"email","value":"email_value"},{"id":"1721314347250","type":"chatid","value":"-1234567890"}]


- **Fetch**: Display captured responses on your website by adding `data-id` and `data-field` values in your tags, received from your Telegram entry message for each entry.
Example:
```html
<h1 data-id="1721111435245" data-field="username"></h1>
<p data-id="1721073826842" data-field="email"></p>
```
- **Update**: To update any entry, simply edit the entry on your Telegram channel and click on `Reload Data` button on our [website](https://etty-db.vercel.app/) to see the changes.

- **Delete**: Simply delete the entry from your Telegram channel.

- **Auth(Verify)**: This feature will be added that will also authorize a user for your website features based on username and password(encrypted and only known by user).
---
P.S -> Even if telegram suffers outages none of our services will suffer except for Update functionality which will have a backup funnel to accept update requests.

This README provides comprehensive information about EttyDB, guiding users from installation and integration to utilizing its features effectively. Adjust the URLs and details as per your actual documentation and service setup.
