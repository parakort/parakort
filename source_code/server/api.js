  var express = require('express');
  const dbConnect = require("./db/dbConnect");
  const User = require("./db/userModel");
  const Trial = require("./db/trialModel");
  const Options = require("./db/optionsModel");
  const Sport = require("./db/sportModel");
  const path = require('path');
  const cron = require('node-cron');
  var router = express.Router();
  require('dotenv').config();
  var axios = require('axios')
  const bcrypt = require("bcrypt");
  const nodemailer = require('nodemailer');
  let userSports
  let mega
  

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



  // Whether to bypass email confirmations, for testing
  const bypass_confirmations = true

  // DB connection: connect then load sports
  dbConnect()
  .then(async () => {
    const sports = await Sport.find({});

    userSports = sports.map(sport => ({
      sportId: sport._id,
      my_level: 0, // Default level or other initialization
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

// Match another user
router.post('/matchUser', async (req, res) => {
  // check if the destination has matched the source
  User.findById(
    { _id: req.body.dest }, // Find the user we are trying to match
    { matches: 1, _id: 0} 
  )
  .then(async (user) => {
    // we found the user we want to match with
    // return whether or not the other user matched us as well.
    const mutual = !!user.matches.find(match => match.uid === req.body.source)
    


    // Return the status of whether we are a mutual match
    res.send(mutual)

    // Update the swiping user's matches database with this user,
    // and whether or not we are currently a mutual match.
    User.findByIdAndUpdate(
      req.body.source,
      { $push: { matches: {uid: req.body.dest, mutual: mutual} } },
    );


    // If this match became mutual, update the other user's existing match object to be mutual, and perform notifications on frontend as arespult.
    if (mutual)
      User.updateOne(
        { _id: req.body.dest, 'matches.uid': req.body.source },  // Query to find the document and the specific UID
        { $set: { 'matches.$.mutual': true } }     // Update operation to set `mutual` to true
      );
  })
  .catch((e) => {
    console.log("failed to match user", e)
    res.status(500).send(e)
  })
})

// Suggest a user to match with
router.post('/suggestUser', async (req, res) => {
  // we need to return a uid,
  // for now, we can pick a random user who is not yet in our suggestion history (async storage ?), or in our matches
  let matches = req.body.matches
  let history = req.body.history

  // for now, just pick a random user from the database.
  const users = await User.aggregate([{ $sample: { size: 1 } }]);

  // Check if a user was found
  if (users.length > 0) {
    res.send(users[0]._id)
    return;
  } 
  
  // There were no users found
  res.status(404).send("No users found")
})

// Delete media at a given index
router.post('/deleteMedia', async (req,res) => {
  console.log("deleitng", req.body.index)
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
  

  let resp = await megaFolder.children[req.body.index].delete(true)
  console.log("deletion response:", resp)
  res.send()
})

router.post('/downloadMedia', async (req,res) => {
  let megaFolder = null;
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
    res.status(404).send("No user media exists")
    return
  }

  let buffers = []
  
  for (const item of megaFolder.children) {
    const type = item.name.includes(".jpg") ? 'Image' : "Video"
    //const file = File.fromURL(item.shareURL)
    const data = await item.downloadBuffer()
    buffers.push({name: item.name, type: type, data: Buffer.from(data).toString('base64')})
  }

  // send the user's profile too, incase its some other user
  let profile = null;


  User.findById({_id: req.body.uid })
  .then((user) => {
    profile = user.profile
  })
  .catch((e) => {
    res.status(500).send(e)
  })

  res.send({media: buffers, profile: profile})
})


// POST endpoint to handle file uploads, compress, and upload to MEGA
router.post('/uploadMedia', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const fileName = req.file.filename;
  const compressedFilePath = `tempUploads/compressed-${fileName}`;

  try {

    if (filePath.includes(".jpg"))
    {

    // Compress the image using Sharp
    await sharp(filePath)
      .resize(800) // Resize the image
      .toFile(compressedFilePath);

    // Upload the compressed file to Mega
    const compressedFileBuffer = fs.readFileSync(compressedFilePath);
    }
      

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

    const file = await megaFolder.upload({ name: fileName }, compressedFileBuffer).complete;
  
    // Clean up local temp files
    fs.unlinkSync(filePath);
    fs.unlinkSync(compressedFilePath);

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
  const allowedFields = ['location', 'filters', 'profile'];

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