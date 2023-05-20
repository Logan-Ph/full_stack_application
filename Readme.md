
GITHUB URL: https://github.com/Logan-Ph/full_stack_application.git

YOUTUBE URL:

NOTE: to conduct test faster, these accounts have passwords that does not meet the requirements, however when signing up for a new account, the requirements are still applied.

-For customer role:
    -username: user1
    -password: 123
    
- For Vendor role:
     -username: applestore
     -password: 123
     
     -username: jendecee
     -password: 123
     
- For shipper role:
      -username : shipper1 (distribution hub: Ho Chi Minh)
      -password: 123
      
      -username: shipper2 (distribution hub: Hanoi)
      -password: 123
      
      -username: shipper3 (distribution hub: Da Nang)
      -password; 123
      
 HOW TO RUN THE WEBSITE: 
  - When start running the file, please be aware that your current directory should be at 'full_stack_application'
  - Run `npm install` (sometimes the sass package occurs an error when install, run `npm uninstall sass`, try install sass again `npm install sass`)
  - To run the website, run `nodemon index.js` or `npm start` inside the terminal
  - Sometimes the website takes a huge amount of time to load, to fix this, type in the url `localhost:3000/logout` and try to log in again.
  - When logging into the website, there might be 2 errors: the  localhost redirected too many times, after successful login (it will have no pop-up alert) the browser is still at the login page; to fix this, try clearing the cookie and log in again or log out by `localhost:3000/logout` and log in again, or just go back and log in again without reloading
