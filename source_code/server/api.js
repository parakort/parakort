  var express = require('express');
  const dbConnect = require("./db/dbConnect");
  const User = require("./db/userModel");
  const Trial = require("./db/trialModel");
  const Chat = require("./db/chatModel.js")
  const Options = require("./db/optionsModel.js");
  const Sport = require("./db/sportModel.js");
  const path = require('path');
  const cron = require('node-cron');
  var router = express.Router();
  require('dotenv').config();
  var axios = require('axios')
  const bcrypt = require("bcrypt");
  const nodemailer = require('nodemailer');
  let userSports
  let mega
  const mongoose = require('mongoose');
  const { Types: { ObjectId } } = mongoose;

  // image uploads
  const multer = require('multer');
  const sharp = require('sharp');
  const { Storage } = require('megajs')
  const { File } = require('megajs')
  const fs = require('fs');

  // Create tempUploads directory
  if (!fs.existsSync('tempUploads')) {
    fs.mkdirSync('tempUploads');
  }

  // Setup Multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'tempUploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage });

  // Setup Mega client
  ;(async function () {
    mega = new Storage({
      email: process.env.MEGA_USER,
      password: process.env.MEGA_PASS,
      userAgent: 'ExampleApplication/1.0'
    })
  
    // Will resolve once the user is logged in
    // or reject if some error happens
    await mega.ready
  }()).catch(error => {
    console.error(error)
  })


  const users = {}; // Map user ID to WebSocket connection


  // Whether to bypass email confirmations, for testing
  const bypass_confirmations = true

  // DB connection: connect then load sports
  dbConnect()
  .then(async () => {
    const sports = await Sport.find({});

    userSports = sports.map(sport => ({
      sportId: sport._id,
      my_level: 1, // Default level to beginner
      match_level: []
    }));

    console.log("Loaded sports")
  })
  
  
  


  // Change password button on login page, send code, when verified, choose new password

  // Mailer
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS,
    },
  });


  // Daily Maitenance
  // * Send warning emails
  // * Delete inactive accounts (if they arent subscribed!)

  // Maitenance
  const job = cron.schedule('0 0 * * *', maintainUsers);
  //const job = cron.schedule('*/30 * * * * *', maintainUsers);
  job.start()
  
let latest;
  
const urlToPing = process.env.PING_URL;
 
const pingUrl = () => {
  axios.get(urlToPing)
    .then((res) => {
      latest = res.data
      
    })
    .catch((error) => {
      setTimeout(pingUrl, 2000); // Retry after 2 seconds
    });
};

cron.schedule('*/10 * * * *', pingUrl);
pingUrl();

  async function maintainUsers()
  {
    const currentDate = new Date();

    // Email me a confirmation that the server is running
    const mailOptions = {
      from: process.env.MAILER_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `Successful ${process.env.APP_NAME} Maitenance`,
      text: `Hi Peter, just a confirmation that maitenance has ran for all ${process.env.APP_NAME} users successfully.`,
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending warning email:', error);
      } else {
      }
    });

    // Calculate the date 10 days from now
    const futureDate = new Date(currentDate);
    futureDate.setDate(currentDate.getDate() + 10);

    // Format the date as "Month Day, Year"
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = futureDate.toLocaleDateString('en-US', options);


    try {

      // SUBSCRIPTIONS

      // Find all users that renew today and check/update entitlements
      let users = await User.find({renewal_date: currentDate.getDate()})
        
      // Iterate through each user and update tokens if they have an active entitlement
      for (const user of users) {
        let subscribed = await isSubscribed(user._id)
        if (subscribed)
        {
          await User.updateOne({ _id: user._id }, { $set: { tokens: process.env.TOKEN_COUNT } });
        }
        else
        {
          // It looks like they expired today. Remove tokens.
          // Update: They did pay for month long access.. so dont remove the tokens. 
          await User.updateOne({ _id: user._id }, { $set: { renewal_date: 0 } });
          // Be sure to stop renewing them.
        }
        
      }


    
      // Increment 'dormant' field by 1 for all users
      await User.updateMany({}, { $inc: { dormant: 1 } });

      // Find and remove users with 'marked_for_deletion' and 'email_confirmed' both set to false
      await User.deleteMany({ marked_for_deletion: true });

      // Email a warning to all inactive users
      const dormantUsers = await User.find({
        $and: [
          { dormant: { $gte: 365 } }
        ]
      });

      // Send each email to dormant users who are not subscribed
      dormantUsers.forEach((user) => {
        
        // Dont delete paying users
        if (!isSubscribed(user._id))
        {
          const mailOptions = {
            from: process.env.MAILER_USER,
            to: user.email,
            subject: `${process.env.APP_NAME} account scheduled for deletion`,
            text: `Your ${process.env.APP_NAME} account hasn't been accessed in ${user.dormant} days, 
            and data is scheduled to be purged from our system on ${formattedDate}. 
            To keep your data, simply log in to your account. We hope to see you soon!`,
          };
        
          // Send the email
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('Error sending warning email:', error);
            } else {
            }
          });
  

        }
        
      });


      // MARK UNCONFIRMED USERS FOR DELETION
      try {
        // Find users where 'email_confirmed' is false
        const unconfirmedUsers = await User.find({ email_confirmed: false });
    
        // For all unconfirmed users prepare to mark for deletion
        // If they are not subscribed
        const updatePromises = unconfirmedUsers
        .filter(user => !isSubscribed(user._id))
        .map((user) => {
          user.marked_for_deletion = true;
          return user.save();
        });

    
        // Execute all the update operations
        await Promise.all(updatePromises);
    
      } catch (error) {
        console.error('Error marking users for deletion:', error);
      }


    } catch (error) {
      console.error('Error updating users:', error);
    }
  }





  // Endpoints

// Temporary management portal while testing.
  router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to unmatch two users and add to dislikes
// src is doing the action, dest needs to be made aware, if they are on the app
// So forceUpdate for dest
router.post('/unmatchUser', async (req, res) => {
  try {
    const { src, dest } = req.body; // Get the user IDs from the request body

    // Ensure both users are provided
    if (!src || !dest) {
      return res.status(400).json({ error: 'Both src and dest user IDs are required' });
    }

    // First, remove dest UID from the src user's matches array and add dest to src's dislikes array
    await User.findByIdAndUpdate(
      src,
      { 
        $pull: { matches: { uid: dest }, likers: {uid: dest} }, // Remove dest from src's matches
        $addToSet: { dislikes: dest } // Add dest to src's dislikes (ensures no duplicates)
      },
      { new: true }
    );

    // Then, remove src UID from the dest user's matches array and add src to dest's dislikes array
    await User.findByIdAndUpdate(
      dest,
      { 
        $pull: { matches: { uid: src } }, // Remove src from dest's matches
        $addToSet: { dislikes: src } // Add src to dest's dislikes (ensures no duplicates)
      },
      { new: true }
    );

    // Force dest to pull latest data, now that it has changed
    forceUpdate(dest)

    // Respond back indicating the unmatch was successful
    res.status(200).json({ message: 'Users have been unmatched and added to dislikes successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Match another user
router.post('/matchUser', async (req, res) => {
  // check if the destination has matched the source
  User.findByIdAndUpdate(
    req.body.dest, // Find the user by ID
    { $addToSet: { likers: req.body.source } }, // Update the likers array
    { projection: { matches: 1, _id: 0 }, new: false } // Return the document before the update
  )
  .then(async (user) => {
    // we found the user we want to match with
    // return whether or not the other user matched us as well.
    const mutual = !!user.matches.find(match => match.uid === req.body.source)
    


    // Return the status of whether we are a mutual match
    res.send(mutual)

    // Update the swiping user's matches database with this user,
    // and whether or not we are currently a mutual match.
      try {
        await User.findByIdAndUpdate(
          req.body.source,
          { $push: { matches: { uid: req.body.dest, mutual: mutual } } },
          { new: true } // Ensures the updated document is returned
        );
      } catch (err) {
        console.error(err); // Print any errors
      }

    // If this match became mutual, update the other user's existing match object to be mutual, and perform notifications on frontend as arespult.
    if (mutual)
      User.updateOne(
        { _id: req.body.dest, 'matches.uid': req.body.source },  // Query to find the document and the specific UID
        { $set: { 'matches.$.mutual': true } }     // Update operation to set `mutual` to true
      );

    // Let the destination user be aware of the changes
    forceUpdate(req.body.dest)

  })
  .catch((e) => {
    console.log("failed to match user", e)
    res.status(500).send(e)
  })
})


// Force a user to get new data, forcing them to call the below endpoint.
function forceUpdate(uid)
{
  // websocket will tell this uid, if they are online (app open),
  // to perform a call to /getData
  // Forward message to the recipient, if they are online
  const recipientWs = users[uid];
  if (recipientWs) {
    recipientWs.send(JSON.stringify({type: 'update'}));
  }

}

// Poll to get new data
// Websocket forces a user to pull new data when we make them aware that there's an update.
router.post('/getData', async (req, res) => {
  const user = await User.findById(req.body.user, 'matches dislikes likers');
  res.send(user)

})

// Sockets for end to end comms

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });


wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const parsedMessage = JSON.parse(message);
  
    if (parsedMessage.type === 'register') {
      users[parsedMessage.userId] = ws;
      console.log("Websocket connected", parsedMessage.userId);
    } else if (parsedMessage.type === 'message') {
  
      const recipientWs = users[parsedMessage.recipientId];
      if (recipientWs) {
        recipientWs.send(JSON.stringify({type: "message", message: parsedMessage.text, timestamp: parsedMessage.timestamp, sender: false}));
      }

      // Forward the message and store it in each user's database document
      let chatSender = await Chat.findOne({ user: parsedMessage.senderId });

      if (!chatSender) {
        chatSender = new Chat({ user: parsedMessage.senderId, chats: new Map() });
      }

      if (!chatSender.chats.has(parsedMessage.recipientId)) {
        chatSender.chats.set(parsedMessage.recipientId, []);
      }

      chatSender.chats.get(parsedMessage.recipientId).push({
        message: parsedMessage.text,
        sender: true,
        timestamp: parsedMessage.timestamp,
      });

      await chatSender.save();

      // Find or create a chat for the recipient
      let chatRecipient = await Chat.findOne({ user: parsedMessage.recipientId });
      if (!chatRecipient) {
        chatRecipient = new Chat({ user: parsedMessage.recipientId, chats: new Map() });
      }

      if (!chatRecipient.chats.has(parsedMessage.senderId)) {
        chatRecipient.chats.set(parsedMessage.senderId, []);
      }

      chatRecipient.chats.get(parsedMessage.senderId).push({
        message: parsedMessage.text,
        sender: false,
        timestamp: parsedMessage.timestamp,
      });

      await chatRecipient.save();
  
    }
  });
  
  

  ws.on('close', () => {
    // Clean up user connections
    for (const [userId, userWs] of Object.entries(users)) {
      if (userWs === ws) {
        delete users[userId];
      }
    }
  });
});

router.get('/messages/:senderId/:recipientId', async (req, res) => {
  const { senderId, recipientId } = req.params;

  try {
    // Convert senderId and recipientId to ObjectId
    const senderObjectId = new mongoose.Types.ObjectId(senderId);

    // Find the chat for the sender and check if the chats Map has the recipientId as a key
    const chat = await Chat.findOne({ user: senderObjectId });

    if (chat && chat.chats.has(recipientId)) {
      // Get the messages for the recipientId
      const messages = chat.chats.get(recipientId);

      return res.json(messages || []);
    } else {
      return res.status(404).json({ message: 'No messages found' });
    }
  } catch (error) {
    console.error("Error loading messages:", error);
    return res.status(500).json({ message: 'An error occurred', error });
  }
});






router.post('/suggestUser', async (req, res) => {
  const filters = req.body.filters;
  const suggestions = req.body.suggestions
  const matches = req.body.matches || [];
  const dislikes = req.body.dislikes || [];
  const location = req.body.location;
  const verboseLogs = false // Set to true to enable detailed logs

  try {
    if (verboseLogs) {
      console.log("Filters received:", JSON.stringify(filters, null, 2));
      console.log("Matches excluded:", matches);
      console.log("Dislikes excluded:", dislikes);
      console.log("User location:", location);
    }

    // Build a query object based on filters
    const ageMinDate = new Date(new Date().setFullYear(new Date().getFullYear() - filters.age.max));
    const ageMaxDate = new Date(new Date().setFullYear(new Date().getFullYear() - filters.age.min));

    // Convert to strings so comparison works
    const ageMinDateStr = ageMinDate.toISOString();
    const ageMaxDateStr = ageMaxDate.toISOString();


    const query = {
      _id: { $nin: [...matches, ...dislikes, ...suggestions] }, // Exclude matches and dislikes
       'profile.birthdate': { $gte: ageMinDateStr, $lte: ageMaxDateStr },
      ...(filters.male || filters.female
        ? { 'profile.isMale': filters.male && filters.female ? { $in: [true, false] } : filters.male ? true : { $ne: true } } // Match gender if specified
        : {}),
      location: {
        $geoWithin: {
          $centerSphere: [
            [location.lat, location.lon], 
            filters.radius / 3963.2 // Convert radius to radians (earth radius in miles)
          ]
        }
      },
      
      $or: filters.sports.map(sport => {
        if (verboseLogs) {
          console.log(`\nChecking sport: ${sport.sportId.name}`);
          console.log(`- Sport ID: ${sport.sportId._id}`);
          console.log(`- User's level: ${sport.my_level}`);
          console.log(`- Match levels: ${sport.match_level.join(", ")}`);
          console.log(`- Querying for sportId: ${sport.sportId._id} and levels: ${sport.match_level}`);
        }
      
        const objId = new ObjectId(sport.sportId._id)
      
      
        return {
          "filters.sports": {
            $elemMatch: {
              "sportId": objId, // Ensure we're matching the correct sportId
              "my_level": { $in: sport.match_level } // Ensure my_level is in the match_level array
            }
          }
        };
      }),
      
    };


    if (verboseLogs) {
      console.log("Interpreted Query:");
      console.log(`Looking for users born between ${ageMinDate.toDateString()} and ${ageMaxDate.toDateString()}.`);
      console.log(`Gender preference: ${filters.male && filters.female ? "Any" : filters.male ? "Male" : filters.female ? "Female" : "None"}.`);
      console.log(`Within a radius of ${filters.radius} miles of (${location.lat}, ${location.lon}).`);
      console.log("Sports preferences:");
      filters.sports.forEach(sport => {
        if (sport.my_level > 0) {
          console.log(`- ${sport.sportId}: User level ${sport.my_level}, matching levels: ${sport.match_level.join(", ")}`);
        }
      });
    }

    // Perform the query with a priority for sports matches
    let users = await User.find(query).limit(1).exec();

    if (users.length > 0) {
      console.log("\nMatch Found:");
      console.log(users[0].profile.firstName, users[0].profile.lastName);
      if (verboseLogs) {
        const matchedUser = users[0];
        
        console.log(`User ID: ${matchedUser._id}`);
        console.log(`Age: ${new Date().getFullYear() - new Date(matchedUser.profile.birthdate).getFullYear()}`);
        console.log(`Gender: ${matchedUser.profile.isMale ? "Male" : "Female"}`);
        console.log("Location:", matchedUser.location);

      }
      res.send(users[0]._id);
    } else {
      if (verboseLogs) {
        console.log("\nNo Matches Found:");
        console.log("Reasons:");

        const allUsers = await User.find({}).exec();

        allUsers.forEach(user => {
          if (matches.includes(user._id) || dislikes.includes(user._id)) {
            console.log(`- User ${user._id} is in matches or dislikes.`);
          } else if (user.profile.birthdate < ageMinDate || user.profile.birthdate > ageMaxDate) {
            console.log(`- User ${user._id} does not match the age range.`);
          } else if ((filters.male && filters.female === false && !user.profile.isMale) || (filters.female && filters.male === false && user.profile.isMale)) {
            console.log(`- User ${user._id} does not match the gender preference.`);
          } else if (!isWithinRadius(user.location, location, filters.radius)) {
            console.log(`- User ${user._id} is outside the radius.`);
          } else {
            console.log(`- User ${user._id} does not match sports preferences.`);
            
          }
        });
      }
      res.status(404).send('No users found');
    }
  } catch (err) {
    console.error("Error during user suggestion:", err);
    res.status(500).send('Error finding a user');
  }
});


function isWithinRadius(userLocation, centerLocation, radiusMiles) {
  const earthRadiusMiles = 3963.2;
  const latDiff = (userLocation.lat - centerLocation.lat) * (Math.PI / 180);
  const lonDiff = (userLocation.lon - centerLocation.lon) * (Math.PI / 180);
  const a = Math.sin(latDiff / 2) ** 2 +
            Math.cos(centerLocation.lat * (Math.PI / 180)) * Math.cos(userLocation.lat * (Math.PI / 180)) *
            Math.sin(lonDiff / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusMiles * c;
  return distance <= radiusMiles;
}






// Delete media at a given index
router.post('/deleteMedia', async (req,res) => {
  let megaFolder = null;
  for (const node of mega.root.children) {
    if (node.name === req.body.uid && node.directory) {
      megaFolder = node;
      break; // Break out of the loop once the folder is found
    }
  }

  // This should not happen
  if (!megaFolder)
  {
    res.status(404).send("No user media exists")
    return
  }
  
  try{
  // Find the image and delete it
  for (const media of megaFolder.children)
  {
    // If we find the file, delete it
    // if we aren't shfiting, we can exit the loop (no need to rename other files)
    if (media.name.charAt(0) == req.body.index)
    {
      media.delete(true)
      if (!req.body.shift) break
    }
    // This is not the file to delete, but we must rename all other files.
    // anything greater than the index we deleted must be decremented
    else if (req.body.shift && media.name.charAt(0) > req.body.index)
    {
      media.rename(String(parseInt(media.name.charAt(0)) - 1) + media.name.substring(1))
    }
  }
  }
  catch (e) {
    res.status(404).send("No user media exists")
    return
  }
  
  // We now search for the image to delete by name (named as index)
  //megaFolder.children[req.body.index].delete(true)
  res.send()
})

router.post('/downloadMedia', async (req,res) => {
  let megaFolder = null;
  let status = 200

  if (!mega.root.children)
  {
    res.status(404).send("No users exist")
  }
  for (const node of mega.root.children) {
    if (node.name === req.body.uid && node.directory) {
      megaFolder = node;
      break; // Break out of the loop once the folder is found
    }
  }

  if (!megaFolder)
  {
    status = 269
    //res.status(404).send("No user media exists")
    //return
  }

  let buffers = []

  try {
  
    for (const item of megaFolder.children) {
      const type = (item.name.toLowerCase().includes(".jpg") || item.name.toLowerCase().includes(".png"))? 'Image' : "Video"
      //const file = File.fromURL(item.shareURL)
      const data = await item.downloadBuffer()

      // Insert to the array at particular indeces based on positional uploading.
      // basically sorts the array to the user's desired order despite chronology
      buffers[item.name.substring(0, 1)] = {name: item.name.substring(1), type: type, data: Buffer.from(data).toString('base64')}

    }
  }
  catch (e) {
    status = 269
    //res.status(404).send("No user media exists")
    //return
  }

  // send the user's profile too, and their sports
  let profile = null;
  let sports = null


  const user = await User.findById(req.body.uid).populate('filters.sports.sportId')
  
  if (user)
  {
    profile = user.profile
    sports = user.filters.sports

    
    profile.age = calculateAge(profile.birthdate) // Add the user's age

    res.status(status).send({media: buffers, profile: profile, sports: sports})
  }
  else
  {
    res.status(500).send(e)
  }
})

function calculateAge(dobString) {
  const dob = new Date(dobString); // Convert string to Date object
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();
  
  // If the current month is before the birth month, or it's the same month but the current day is before the birth day, subtract one year
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}


// POST endpoint to handle file uploads, compress, and upload to MEGA
router.post('/uploadMedia', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const compressedFilePath = `tempUploads/compressed-${fileName}`;

  try {
    const isImg = filePath.toLowerCase().includes(".jpg") || filePath.toLowerCase().includes(".png")

    if (isImg)
    {

    // Compress the image using Sharp
    await sharp(filePath)
      .resize(800) // Resize the image
      .toFile(compressedFilePath);

    
    }
    const compressedFileBuffer = fs.readFileSync(isImg? compressedFilePath : filePath);
      

    let megaFolder;

    if (!mega.root.children)
    {
      await mega.mkdir(req.body.uid);
    }
    
    for (const node of mega.root.children) {
      if (node.name === req.body.uid && node.directory) {
        megaFolder = node;
        break; // Break out of the loop once the folder is found
      }
    }
    

    if (!megaFolder) {
      megaFolder = await mega.mkdir(req.body.uid);
    }

    // Upload compressed file to mega
    await megaFolder.upload({ name: fileName }, compressedFileBuffer).complete;
  
    // Clean up local temp files
    fs.unlinkSync(filePath);
    if (isImg) fs.unlinkSync(compressedFilePath)

    // Return the Mega file URL
    // No longer returning this because it is not direct downloadable, encrypted so useless
    //res.send(link);

    res.send();
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload file to Mega' });
  }
});



  
  // Database update endpoint
  // Updates the provided 'field' with the given 'newValue'.
  // need to only permit certain fields: cosmetic ones that can be exposed to frontend
  const allowedFields = ['location', 'filters', 'profile', 'dislikes'];

router.post('/updateField', async (req, res) => {
    const { uid, field, newValue } = req.body;

    // Check if the field is allowed or if it starts with an allowed field followed by a dot
    const isAllowed = allowedFields.some(allowedField => {
        return field === allowedField || field.startsWith(`${allowedField}.`);
    });

    if (!isAllowed) {
        return res.status(400).send("Invalid field");
    }

    try {
        // Construct the update object
        const updateObject = { $set: { [field]: newValue } };
        
        let usr = await User.findByIdAndUpdate(uid, updateObject, { new: true });

        res.status(200).send();
    } catch (error) {
        console.error("Error persisting database:", error);
        res.status(500).send();
    }
});



  async function isSubscribed(user_id) {
    const maxRetries = 3; // Maximum number of retry attempts
    let retries = 0;
  
    while (retries < maxRetries) {
      try {
        const options = {
          method: 'GET',
          url: `https://api.revenuecat.com/v1/subscribers/${user_id}`,
          headers: { accept: 'application/json', Authorization: `Bearer ${REVENUECAT_API_KEY}` },
        };
  
        const response = await axios.request(options);
  
        // The user
        const subscriber = response.data.subscriber;
        const entitlements = subscriber.entitlements;
  
        // Look at the user's entitlements to check for cards
        for (const value of Object.values(entitlements)) {
          if (value['product_identifier'] === 'cards') {
            // Check if it is active
            const expirationTime = new Date(value.expires_date);
            const currentTime = new Date();
            return expirationTime > currentTime;
          }
        }
  
        // If no relevant entitlement was found, assume not subscribed
        return false;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          const retryAfterHeader = error.response.headers['Retry-After'];
          if (retryAfterHeader) {
            const retryAfterMs = parseInt(retryAfterHeader)
            console.log(`Too Many Requests. Retrying after ${retryAfterMs} milliseconds...`);
            await wait(retryAfterMs);
          } else {
            console.log('Too Many Requests. No Retry-After header found.');
          }
          retries++;
        } else {
          // Handle other types of errors or non-retryable errors
          return false;
        }
      }
    }
  
    throw new Error(`Request to get isSubscribed failed after ${maxRetries} retries`);
  }
  
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



  // Ensure alive
  router.get('/ping', async(req, res) => {
    res.json(Date.now())
  })

  // *** @TODO MUST ADD SECURITY (OTP) FOR SERVER MANAGEMENT ENDPOINTS

  // Endpoint to add test users 
  router.post('/addTestUser', async (req, res) => {

    function generateRandomBirthdate() {
      // Define age ranges with their probabilities
      const ageRanges = [
          { min: 18, max: 40, weight: 0.7 }, // 70% chance
          { min: 41, max: 65, weight: 0.2 }, // 20% chance
          { min: 66, max: 99, weight: 0.1 }  // 10% chance
      ];
  
      // Choose an age range based on the probabilities
      const random = Math.random();
      let selectedRange;
      let cumulativeWeight = 0;
  
      for (const range of ageRanges) {
          cumulativeWeight += range.weight;
          if (random < cumulativeWeight) {
              selectedRange = range;
              break;
          }
      }
  
      // Generate a random age within the selected range
      const age = Math.floor(Math.random() * (selectedRange.max - selectedRange.min + 1)) + selectedRange.min;
  
      // Calculate the birth year
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - age;
  
      // Generate a random month and day
      const birthMonth = Math.floor(Math.random() * 12) + 1; // 1 to 12
      const birthDay = Math.floor(Math.random() * 28) + 1;   // 1 to 28 to ensure valid dates
  
      // Create the birthdate
      const birthdate = new Date(birthYear, birthMonth - 1, birthDay);
  
      // Return the birthdate in ISO 8601 format
      return birthdate.toISOString();
  }
  
  
    const { count } = req.body;

    // Validate count
    if (typeof count !== 'number' || isNaN(count)) {
        return res.status(400).send({ message: 'Invalid input. Count must be a valid number.' });
    }

    if (count === -1) {
        try {
            // Delete all test users
            const result = await User.deleteMany({ test: true });
            return res.status(200).send({ message: `${result.deletedCount} users deleted.` });
        } catch (error) {
            console.error('Error deleting test users:', error);
            return res.status(500).send({ message: 'Error deleting test users.' });
        }
    }

    if (count < 1) {
        return res.status(400).send({ message: 'Please enter a number greater than 0.' });
    }

    // Add test users
    try {
        const usersToAdd = [];
        const endpoint = 'https://api.openai.com/v1/chat/completions';
        const query = `Your task is to respond with (and only with) a stringified JSON object that i can directly use JSON.parse on your response. It is to be an array of objects, of length ${count}, consisting of sample users for my program. Do not write a script to do it, generate it with AI. The fields for each are as follows: isMale: a random true or false value. firstName: a random first name, that matches the gender you chose. lastName: a random last name. bio: a random bio, of 5-20 words, where the user tells about themself briefly (they are looking for people to play sports with). lat: a random latitude value, but this must be within a 50 mile radius of 40.77781589239908, -73.03254945210463. lon: a random longitude, following the same radius constraint aforementioned.`

        const messages = [
          { role: 'user', content: query },
        ];
        
        axios.post(
          endpoint,
          {
            model: 'gpt-3.5-turbo',
            messages: messages,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.GPT_KEY}`,
            },
          }
        )
        .then(async (resp) => {
          let userData = JSON.parse(resp.data.choices[0].message.content)
          const sports = await Sport.find({});

    

          for (let i = 0; i < count; i++) {

            let userSports = sports.map(sport => ({
              sportId: sport._id,
              my_level: Math.floor(Math.random() * 4),
              match_level: [1, 2, 3].filter(() => Math.random() < 0.5)
            }));


            usersToAdd.push({
                password: "test",
                email: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@none.com`,
                test: true, // Indicate it's a test user
                filters: {
                  sports: userSports
                },
                profile: {
                  birthdate: generateRandomBirthdate(),
                  firstName: userData[i].firstName,
                  lastName: userData[i].lastName,
                  isMale: userData[i].isMale,
                  bio: userData[i].bio,
                  socials: {
                    instagram: "test",
                    facebook: "test",
                    linkedin: "test"
                  }
                  
                },
                location: {
                  lat: userData[i].lat,
                  lon: userData[i].lon
                },
                marked_for_deletion: false,

            });
        }

        const result = await User.insertMany(usersToAdd);
        return res.status(201).send({ message: `${result.length} test users added successfully.` });
        
        })

        

        
    } catch (error) {
        console.error('Error adding test users:', error);
        return res.status(500).send({ message: `Error adding test users: ${error.message}` });
    }
});


  // Endpoint to add a sport
router.post('/addSport', async (req, res) => {
  const { name, image } = req.body;

  try {

    // Create new sport
    const newSport = new Sport({ name, image });

    // Save sport to the database
    await newSport.save();

    // Update all users to include the new sport
    await User.updateMany(
      {}, 
      { $push: { 'filters.sports': { sportId: newSport._id, my_level: 0, match_level: [] } } }
    );

    res.status(201).send({ message: 'Sport added successfully', sport: newSport });
  } catch (error) {
    console.error('Error adding sport:', error);
    res.status(500).send({ message: 'Error adding sport' });
  }
});

// delete sport
router.delete('/deleteSport/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Validate input
    if (!id) {
      return res.status(400).send({ message: 'Sport ID is required' });
    }

    // Find and delete the sport
    const deletedSport = await Sport.findByIdAndDelete(id);

    if (!deletedSport) {
      return res.status(404).send({ message: 'Sport not found' });
    }

    // Remove the sport from all users
    await User.updateMany(
      {},
      { $pull: { 'filters.sports': { sportId: id } } }
    );

    res.status(200).send({ message: 'Sport deleted successfully' });
  } catch (error) {
    console.error('Error deleting sport:', error);
    res.status(500).send({ message: 'Error deleting sport' });
  }
});

   // A user just subscribed
  // Verify their reciept => grant tokens
  router.post('/newSubscriber', async(req, res) => {
    let user_id = req.body.user_id
    // Anyone can call this endpoint
    // Implement security by checking subscription status
    const subscribed = await isSubscribed(user_id);

    if (subscribed)
    {
      let currentDate = new Date();
      let dayofmonth = currentDate.getDate()
      // User is verified! Grant the tokens
      User.findByIdAndUpdate(
        req.body.user_id,
        {
          // Sets the tokens to TOKEN_COUNT and stores the date on which to renew.
          $set: { tokens: process.env.TOKEN_COUNT, renewal_date: dayofmonth} // Set tokens
        }, {new: true}).then((user) => {
    
          if (user)
          {
            // Send me a notice email
            const mailOptions = {
              from: process.env.MAILER_USER,
              to: process.env.MAILER_USER,
              bcc: process.env.ADMIN_EMAIL,
              subject: `🎉 ${process.env.APP_NAME} NEW SUBSCRIBER! `,
              text: `Woohoo! 🥳 ${user.email} just subscribed!`,
            };
          
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error sending warning email:', error);
              } else {
              }
            });

            res.status(200).send({
              message: "Success!",
              tokens: user.tokens
            });
          }
          else
          {
            res.status(404).send({
              message: "User not found!",
            });
          }
        })
        .catch((e) => {
          res.status(500).send({
            message: e,
          });
        })


    }
    else
    {
      // User is not subscribed return 401 unauthorized.
      res.status(401).send({status: "Unauthorized"})
    }

  })
  
  // Mark user as active when app is opened
  router.post('/appOpened', (req, res) => {
    User.findByIdAndUpdate(
      
      req.body.user_id,
      {
        $set: { dormant: 0 }
      }, {new: true}).then((user) => {
        console.log(user?.email, "opened the app")
      })
  })
  

  // Load the user when they log in
  // Can we move this to the return of /login? this is unclear!
  // the reason we don't, is because we only need to /login once which gets the id (and will also return the user object), 
  // and /user is used once we have the id to get the user object from id (where /login gets it from email / pass)

  router.post('/user', async (req, res) => {
    // Define fields to exclude from the user object (for security)
    const excludedFields = ["password"];
  
    // Utility function to remove specified fields from user obj
    const excludeFields = (obj) => {
      const newObj = { ...obj };
      excludedFields.forEach(field => delete newObj[field]);
      return newObj;
    };
  
    try {
      // Update user status and populate sport objects
      const user = await User.findByIdAndUpdate(
        req.body.user_id,
        { $set: { dormant: 0 } }, // Update dormant field
        { new: true }
      ).populate('filters.sports.sportId'); // Populate sportId in the filters.sports array
  
      if (user) {
        res.status(200).send({
          user: excludeFields(user.toObject()),
        });
      } else {
        res.status(404).send({
          message: "User not found!",
        });
      }
    } catch (error) {
      console.error("Error finding user:", error);
      res.status(500).send({
        message: "Error finding user",
      });
    }
  });
  

  // Change the password
  router.post('/setNewPassword', async(req,res) => {
    let code = req.body.resetCode
    let pass = req.body.pass
    let email = req.body.email

    // Find the user 
    let user = await User.findOne({email: email})


        // Validate request
        if (user && user.code == code) {
          // user is authorized to change the password
          // hash the password
          bcrypt
          .hash(pass, 5)
          .then((hashedPassword) => {
            // create a new user instance and collect the data
            user.password = hashedPassword

            // save the user
            user.save()
              // return success if the new user is added to the database successfully
              .then((updatedUser) => {
                res.status(200).send({
                  message: "Password changed successfully",
                  token: user._id,
                  new_user: false
                });
              })
              // catch error if the new user wasn't added successfully to the database
              .catch((errorResponse) => {

                  res.status(500).send({
                    message: "Error changing password!",
                    errorResponse,
                  });
                
              });
          })
          // catch error if the password hash isn't successful
          .catch((e) => {
            res.status(500).send({
              message: "Password was not hashed successfully",
              e,
            });
          });

        }

        else{
          //unauthorized request
          res.status(401)
          res.json('Unauthorized')
        }


    
  })

  // Send reset code to email
  router.post('/resetPassword', (req, res) => {
    const randomDecimal = Math.random();
      const code = Math.floor(randomDecimal * 90000) + 10000;

      const updateOperation = {
          $set: {
            code: code
          },
        };
        
        // Use findOneAndUpdate to update the user's properties
        User.findOneAndUpdate(
          { email: req.body.email }, // Find the user by email
          updateOperation).then(() => {

            const mailOptions = {
              from: process.env.MAILER_USER,
              to: req.body.email,
              subject: `${code} is your ${process.env.APP_NAME} confirmaition code`,
              text: `A new password was requested for your account. If this was you, enter code ${code} in the app. If not, somebody tried to log in using your email.`,
            };
          
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error sending email:', error);
                res.status(500)
                res.json({error: "error sending email"})
              } else {
                console.log('successfully sent code')
                res.status(200)
                res.json('successfully sent password reset email')
                
              }
            });
          }) 

  })

  // Function to send a verification code
  // New device is recognized during login. User account exists.
  // Must take user id and email, and device_id
  // store device_id in pending_device in user db
  // generate and store a device_code in user db
  // send email with the code and message
  async function sendCode(user, device) {

    return new Promise((resolve, reject) => {
      // Generate code
      const randomDecimal = Math.random();
      const code = Math.floor(randomDecimal * 90000) + 10000;

      const updateOperation = {
          $set: {
            code: code,
            pending_device: device,
            code_attempts: 0, // Reset failure count
          },
        };
        
        // Use findOneAndUpdate to update the user's properties
        User.findOneAndUpdate(
          { _id: user._id }, // Find the user by object ID
          updateOperation, // Apply the update operation
          { new: true }).then(() => {

            const mailOptions = {
              from: process.env.MAILER_USER,
              to: user.email,
              subject: `${code} is your ${process.env.APP_NAME} confirmaition code`,
              text: `Your ${process.env.APP_NAME} account was accessed from a new location. If this was you, enter code ${code} in the app. If not, you can change your password in the app. Feel free to reply to this email for any assistance!`,
            };
          
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error sending email:', error);
                reject('Could not send mail!')
              } else {
                console.log('successfully sent code')
                resolve('Sent code!')
                
              }
            });
          }) 
        
    }) // Promise end
    }

  // Check the code the user provided
  router.post("/confirmDevice", async (req, response) => {
      // fetch the pending code and device id 
      let user = await User.findOne({email: req.body.email})

      //let user = null
          if (user) {
              
              // Check if the codes match, if so add the device
              if (user.code == req.body.code)
              {
                // Before adding this device, check if we can activate trial tokens
                Trial.findOne({}).then((trial_doc) => {

                  const emailExists = trial_doc.emails.includes(user.email);
                  const deviceExists = trial_doc.devices.includes(user.pending_device);
                  let new_user = true

                  if (emailExists)
                  {
                    new_user = false
                  }
                  else
                  {
                    trial_doc.emails.push(user.email)
                  }

                  if (deviceExists)
                  {
                    new_user = false
                  }
                  else
                  {
                    trial_doc.devices.push(user.pending_device)
                  }

                  

                  trial_doc.save()


                  // Confirm email / grant trial if applicable
                  User.findByIdAndUpdate(
                    user._id,
                    {
                      // Grant trial if applicable
                      $inc: { tokens: new_user? process.env.TRIAL_TOKENS: 0 },
                      $set: { email_confirmed: true }, // Confirmed the email
                      $push: { devices: user.pending_device}
                    },
                    { new: true }).then((updatedUser) => {

                      if (updatedUser) {
                        
                        if (!emailExists)
                        {

                          // Email me of the new user, if option is enabled
                          Options.findOne({}).then((option_doc) => {
                            if (option_doc.registerAlerts)
                            {
                              // Send the email
                              const mailOptions = {
                                from: process.env.MAILER_USER,
                                to: process.env.MAILER_USER,
                                bcc: process.env.ADMIN_EMAIL,
                                subject: `${process.env.APP_NAME} new user! 😁`,
                                text: `${request.body.email} has signed up!`,
                              };
                            
                              // Send the email
                              transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                  console.log('Error sending new user email (to myself):', error);
                                } else {
                                }
                              });
                              
                            }

                          })
                        }

                        response.status(200).send({
                          message: "Success!",
                          new_user: new_user,
                          token: user._id
                        });


                      } else {
                        response.status(404).send({
                            message: "Could not locate user",
                        });
                      }

                    })
                })

                  
                    
  
              }
              else{

                // If this is their third failed code
                if (user.code_attempts >= 2)
                {
                  // Return exhausted status
                  response.status(429).send({
                    message: "Too many requests!",
                    });

                  return
                }

                // First or second failure: Increase count and send wrong code 401
                User.findByIdAndUpdate( user._id, { $inc: { code_attempts: 1 } },
                  { new: true }).then((updatedUser) => {

                    if (updatedUser) {
                      


                    } else {
                      console.log('Failed updating user document api/confirmDevice')
                      response.status(404).send({
                          message: "Could not locate user",
          
                      });
                    }

                  })

                  // Moved to here instead of if statement so the UI response does not wait on a DB operation
                  response.status(401).send({
                    message: "Wrong code!",
                    });
                
              }
      
          //console.log('Code:', user.code);
          //console.log('Pending Device:', user.pending_device);
          } else {
              response.status(404).send({
                  message: "Could not find user",
                });
          }
  })

  // Send help email
  router.post("/contact", (request, response) => {
    const mailOptions = {
      from: process.env.MAILER_USER,
      to: process.env.MAILER_USER,
      bcc: process.env.ADMIN_EMAIL,
      subject: `${process.env.APP_NAME} Support`,
      text: `${request.body.msg}\n\nfrom ${request.body.email} (${request.body.uid})`,
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending support email from user:', error);
        response.status(500).send("Error")
      } else {
        response.status(200).send("Success")

      }
    });
  })

  // register endpoint
  // makes an account
  router.post("/register", (request, response) => {
      // hash the password
      bcrypt
        .hash(request.body.password, 5)
        .then((hashedPassword) => {
          // create a new user instance and collect the data

          const user = new User({
            email: request.body.email,
            password: hashedPassword,
            email_confirmed: bypass_confirmations,
            filters: {
              sports: userSports // Initialize filters.sports with sports data
            }
          });
    
          // save the new user
          user.save()
            // return success if the new user is added to the database successfully
            .then((result) => {
              // Email me of the new user, if option is enabled
              Options.findOne({}).then((option_doc) => {
                if (option_doc.registerAlerts)
                {
                  // Send the email
                  const mailOptions = {
                    from: process.env.MAILER_USER,
                    to: process.env.MAILER_USER,
                    bcc: process.env.ADMIN_EMAIL,
                    subject: `${process.env.APP_NAME} new user! 😁`,
                    text: `${request.body.email} has signed up!`,
                  };
                
                  // Send the email
                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      console.log('Error sending new user email (to myself):', error);
                    } else {
                    }
                  });
                  
                }

              })

              response.status(201).send({
                message: "User Created Successfully",
                result,
              });
            })
            // catch error if the new user wasn't added successfully to the database
            .catch((errorResponse) => {
              let errorMessage = null;

              for (const key in errorResponse['errors']) {
                if (errorResponse['errors'][key].properties && errorResponse['errors'][key].properties.message) {
                  errorMessage = errorResponse['errors'][key].properties.message;
                  break; // Stop iterating once found
                }
              }

              if (errorMessage)
              {
                console.log(errorMessage)
                response.status(403).send({
                  message: errorMessage,
                  errorResponse,
                });
              }
              else{
                response.status(500).send({
                  message: "User already exists!",
                  errorResponse,
                });
              }
              
              
            });
        })
        // catch error if the password hash isn't successful
        .catch((e) => {
          response.status(500).send({
            message: "Password was not hashed successfully",
            e,
          });
        });
    });
    

  // login / register merged endpoint
  
  router.post("/log-or-reg", (request, response) => {
      // check if email exists
      
      User.findOne({ email: request.body.email })
      
        // if email exists
        .then((user) => {
          
          
          
          // compare the password entered and the hashed password found
          bcrypt
            .compare(request.body.password, user.password)

            // if the passwords match
            .then(async (passwordCheck) => {
              

              
    
              // check if password matches
              if(!passwordCheck) {
                  return response.status(400).send({
                  message: "Passwords does not match",
                });
              }

              console.log('Logging in..')

              //Now check if device is permitted
              if (bypass_confirmations || user.devices.includes(request.body.device) || user.email == "demo@demo.demo")
              {
                
                  response.status(200).send({
                      message: "Login Successful",
                      token: user._id,
                      new_user: false
                  });
              }
              else 
              {
                  // Device not recognized. Send email code to recognize device!
                  // When code is entered, allow the login and add the device to DB.

                  sendCode(user, request.body.device).then((res) =>
                  {
                    console.log("code sent!")
                      // Code was sent successfully 
                      response.status(422).send({
                          message: res
                      });

                  })
                  .catch((error) => {
                    console.log(error)
                    response.status(500).send({
                      message: error,
                  });
                  })
                  
              }

              
    
              
            })
            // catch error if password does not match
            .catch((error) => {
              console.log(error)
              response.status(400).send({
                message: "Passwords do not match",
                error,
              });
            });
        })
        // catch error if email does not exist
        .catch((e) => {
          
          // @REGISTER : EMAIL NOT FOUND
          // hash the password
          bcrypt
          .hash(request.body.password, 5)
          .then((hashedPassword) => {
            // create a new user instance and collect the data
            const user = new User({
              email: request.body.email,
              password: hashedPassword,
              email_confirmed: bypass_confirmations,
              filters: {
                sports: userSports // Initialize filters.sports with sports data
              }
            });
      
            // save the new user
            user.save()
              // return success if the new user is added to the database successfully
              .then((result) => {
                

                if (bypass_confirmations)
                {
                  response.status(200).send({
                    message: "Registration Successful",
                    token: user._id,
                    new_user: false
                  });
                }
                else
                {
                  // Now, send the code to verify the email
                  sendCode(user, request.body.device)
                  .then((res) =>
                    {
                      console.log("code sent!")
                        // Code was sent successfully 
                        response.status(422).send({
                            message: res
                        });
      
                    })
                    .catch((error) => {
                      console.log(error)
                      response.status(500).send({
                        message: error,
                      });
                    })
                }

              })
              // catch error if the new user wasn't added successfully to the database
              .catch((errorResponse) => {
                
                  response.status(500).send({
                    message: "Internal error!",
                    errorResponse,
                  });
                
                
              });
          })
          // catch error if the password hash isn't successful
          .catch((e) => {
            response.status(500).send({
              message: "Password was not hashed successfully",
              e,
            });
          });

        });
    });

    //login
router.post("/login", (request, response) => {
  // check if email exists
  
  User.findOne({ email: request.body.email })
  
    // if email exists
    .then((user) => {
      
      
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)

        // if the passwords match
        .then(async (passwordCheck) => {

          

          // check if password matches
          if(!passwordCheck) {
              return response.status(400).send({
              message: "Passwords does not match",
            });
          }

          console.log('Logging in..')

          //Now check if device is permitted
          if (user.devices.includes(request.body.device) || user.email == "demo@demo.demo")
          {

              response.status(200).send({
                  message: "Login Successful",
                  token: user._id,
                  new_user: false
              });
          }
          else 
          {
              // Device not recognized. Send email code to recognize device!
              // When code is entered, allow the login and add the device to DB.

              sendCode(user, request.body.device)
              .then((res) =>
              {
                console.log("code sent!")
                  // Code was sent successfully 
                  response.status(422).send({
                      message: res
                  });

              })
              .catch((error) => {
                console.log(error)
                response.status(500).send({
                  message: error,
              });
              })
              
          }

          

          
        })
        // catch error if password does not match
        .catch((error) => {
          console.log(error)
          response.status(400).send({
            message: "Passwords do not match",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

 

  // Delete account
  router.post('/deleteAccount', async(req, response) => {
    let pwd = req.body.password
    let id = req.body.id

    User.findById({_id: id })
      
        // if email exists
        .then((user) => {
          
          
          // compare the password entered and the hashed password found
          bcrypt
            .compare(pwd, user.password)

            // if the passwords match
            .then(async (passwordCheck) => {
    
              // check if password matches
              if(!passwordCheck) {
                  return response.status(400).send({
                  message: "Passwords does not match",
                });
              }

              User.findByIdAndDelete(id)
              .then((res)=> {
                response.status(200).send({
                  message: "Delete Successful"
              });

              })
              .catch((e) => {
                response.status(500).send({
                  message: e
              });

              })

                  
              
            })
            // catch error if password does not match
            .catch((error) => {
              console.log(error)
              response.status(400).send({
                message: "Passwords does not match",
                error,
              });
            });
        })
        // catch error if email does not exist
        .catch((e) => {
          
          response.status(404).send({
            message: "User not found",
            e,
          });
        });
  })


  module.exports = router;