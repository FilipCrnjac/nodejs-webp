# Node.js server for image upload and conversion to webP format

Very simple Node.js server using Express.js web application framework allowing user to upload and preview images.
The image is being converted after upload to webP lossy and lossess formats using different quality values.
Supports both PNG and JPG format. 

In this code you can see examples of:
 - express APIs routing mechanism
 - express middleware (securing routes with dummy auth)
 - serving static files
 - image upload using multer (differentiating user)
 - converting images to webP format with using different quality values
 - file management etc.
 
# Get started: 
    
    npm install && npm start

Then go to [http://localhost:3003](http://localhost:3003). 

---
Please note that some code is commented on purpose so you can use it to suit your needs.

Learn and have fun!
