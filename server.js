const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const bcrypt = require('bcrypt');



const mongoose = require("mongoose");
const database = module.exports = () => {
    const connectionParams = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
    try{
        mongoose.connect('mongodb+srv://ikram:1234@cluster0.jflsuiq.mongodb.net/?retryWrites=true&w=majority', connectionParams);
        console.log("Database connected!!!!!!!");
    }
    catch(error){
        console.log(error);
        console.log('Database Failed!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    }
};
database();



///////////
/*const utilisateurSchema = new mongoose.Schema({
    emali: { type: String, required: true },
    password: { type: String, required: true }
  });
  
const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);
  
module.exports = Utilisateur;


/////////////////////
/*const Utilisateur = require('./models/utilisateur');

// Vérifier les informations de connexion de l'utilisateur
app.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const utilisateur = await Utilisateur.findOne({ email: email, password: password });

  if (utilisateur) {
    // Authentification réussie, rediriger vers la page d'accueil
    res.redirect('/');
  } else {
    // Informations de connexion incorrectes, afficher un message d'erreur
    res.render('login', { message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
  }
});*/

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true }
  });
  
  const User = mongoose.model('User', userSchema);
  
  module.exports = User;

  app.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = await User.findOne({ email: email });

  if (user) {
    // Vérifiez le mot de passe
    if (user.password === password) {
      res.redirect('/');
    } else {
      res.render('login', { message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
    }
  } else {
    res.render('login', { message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
  }
});

  











//Set static folder
app.use(express.static(path.join(__dirname, 'html_css')));

const botName = 'ChatCord Bot';

// Run when client connect
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //Welcome current user 
        socket.emit('message', formatMessage(botName, 'Welcome to ROCHAT!'));


        
        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} est rejoindre le Chat`));



        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });


    //Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });


    //Runs when client disconnectes
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} est quitter le chat`));

            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }


    });


});



const PORT = 8000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));