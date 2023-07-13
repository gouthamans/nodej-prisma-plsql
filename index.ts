
import cors from 'cors';
import express from "express";
import { Request, Response, NextFunction } from 'express';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv';


dotenv.config();
const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const secretKey = '#$@%$*&abcd';
app.post("/restapi/registeruser", async (req, res) => {
    try {
        const email = req.body.email;
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            return res.status(401).json({ error: 'EmailId Already exist' });
        }
        
        const userData = {
            email: req.body.email,
            name: req.body.name,
            password: hashedPassword
        };
        const createdUser = await prisma.user.create({
            data: userData,
        });

        res.json({ createdUser });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

app.post('/restapi/userlogin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials1' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials2' });
        }
        //   const SECRETKEY = process.env.SECRETKEY;
        const token = jwt.sign({ id: user.id }, secretKey);

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

  const authenticateToken = (req:Request, res:Response, next:NextFunction) => {
    const token = req.headers['authorization'];

    if (token == null) {
        return res.json({"msg" : "Token Is Not Available"});
    }
  
    jwt.verify(token, secretKey, (err: any, user: any) => {
      if (err) {
        return res.json({"msg" : "Authorization Failed"});
      }
      
    //   req.user = user;
      next();
    });
  };
//Create Movie master
app.post("/restapi/createmoviemaster", authenticateToken ,async (req, res) => {
    try {
        console.log("tas==>");
        const releaseDate = new Date(req.body.releaseDate);
        const movieData = {
            movieName: req.body.movieName,
            genre: req.body.genre,
            releaseDate: releaseDate,
            userId: parseInt(req.body.userId),
            cast: {
                connect: {
                    id: parseInt(req.body.castid),
                },
            }
        };

        const createdMovie = await prisma.movie.create({
            data: movieData,
        });
        // console.log("test",createdMovie.id);
        const createdRating = await prisma.userRating.create({
            data: {
              rating: req.body.rating,
              userId: Number(req.body.userId),
              movieId :Number(createdMovie.id)
            },
          });

        res.json({ createdMovie });
    } catch (error: any) {
        console.log(error.message);
        res.json({ error: error.message });
    }
});

//Get a Movie master
app.get("/restapi/getmoviemaster/:id", async (req, res) => {
    try {
        const getmovieobj = await prisma.movie.findUnique({
            where: {
                id: Number(req.params.id),
            },
            include: {
                cast: true,
                // userRating: true
              }
        });

        res.json({ getmovieobj });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

app.get("/restapi/getallmoviemaster", async (req, res) => {
    try {
        const getallmovieobj = await prisma.movie.findMany({
            include: {
                cast: true,
                // userRating: true
          }
        });

        res.json({ getallmovieobj });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

//Update a Movie master
app.patch("/restapi/updatemoviemaster/:id", async (req, res) => {
    try {

        const releaseDate = new Date(req.body.releaseDate);
        const movieData = {
            movieName: req.body.movieName,
            rating: req.body.rating,
            genre: req.body.genre,
            releaseDate: releaseDate,
            userId: req.body.userId,
            cast: {
                connect: {
                    id: req.body.castid,
                },
            },
        };


        const updatemovieobj = await prisma.movie.update({
            where: {
                id: Number(req.params.id),
            },
            data: movieData,
        });
        const createdRating = await prisma.userRating.create({
            data: {
              rating: req.body.rating,
              userId: Number(req.body.userId),
              movieId :Number(updatemovieobj.id)
            },
          });
        res.json({ updatemovieobj });
    } catch (error: any) {
        res.json({ error: error.message }); 
    }
});

// Delete a Movie master
app.delete("/restapi/deletemoviemaster/:id", async (req, res) => {
    try {
        await prisma.movie.delete({
            where: {
                id: Number(req.params.id),
            },
        });
        res.json({ msg: "Deleted Successfully" });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

//create cast master
app.post("/restapi/createcast", async (req, res) => {
    try {

        const castData = {
            name: req.body.name,
            userId: Number(req.body.userId)
        };
        const createdCastMember = await prisma.cast.create({
            data: castData,
        });

        res.json({ createdCastMember });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

//Get a cast master
app.get("/restapi/getcast/:id", async (req, res) => {
    try {
        const getcastobj = await prisma.cast.findUnique({
            where: {
                id: Number(req.params.id),
            },
        });

        res.json({ getcastobj });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

//Get a cast master
app.get("/restapi/getallcast", async (req, res) => {
    try {
        const getcastobj = await prisma.cast.findMany();

        res.json({ getcastobj });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});
//Update a Cast master
app.patch("/restapi/updatecast/:id", async (req, res) => {
    try {

        const castData = {
            name: req.body.name,
            userId: req.body.userId
        };

        const updatecastobj = await prisma.cast.update({
            where: {
                id: Number(req.params.id),
            },
            data: castData,
        });

        res.json({ updatecastobj });
    } catch (error: any) {
        // next(error.message)
        res.json({ error: error.message }); 
    }
});

// Delete a Movie
app.delete("/restapi/deletecast/:id", async (req, res) => {
    try {
        await prisma.cast.delete({
            where: {
                id: Number(req.params.id),
            },
        });
        res.json({ msg: "Deleted Successfully" });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

//create cast master
app.post("/restapi/createrating", async (req, res) => {
    try {

        const ratingData = {
            rating: req.body.rating,
            movieId: req.body.movieId,
            userId: req.body.userId
        };
        const createdCastMember = await prisma.userRating.create({
            data: ratingData,
        });

        res.json({ createdCastMember });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

//Get a cast master
app.get("/restapi/getrating/:id", async (req, res) => {
    try {
        const getratingobj = await prisma.userRating.findUnique({
            where: {
                id: Number(req.params.id),
            },
        });

        res.json({ getratingobj });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

//Update a Cast master
app.patch("/restapi/updaterating/:id", async (req, res) => {
    try {

        const ratingData = {
            name: req.body.rating,
            movieId: req.body.movieId,
            userId: req.body.userId
        };

        const updatecastobj = await prisma.userRating.update({
            where: {
                id: Number(req.params.id),
            },
            data: ratingData,
        });

        res.json({ updatecastobj });
    } catch (error: any) {
        // next(error.message)
        res.json({ error: error.message }); 
    }
});

// Delete a Movie
app.delete("/restapi/deleterating/:id", async (req, res) => {
    try {
        await prisma.userRating.delete({
            where: {
                id: Number(req.params.id),
            },
        });
        res.json({ msg: "Deleted Successfully" });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});






app.listen(3000, () => {
    console.log("App listening on port 3000");
});
