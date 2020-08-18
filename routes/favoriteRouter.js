const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../authenticate");
const cors = require("./cors");

const Favorites = require("../models/favorite");
const user = require("../models/user");
const dishRouter = require("./dishRouter");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route("/")
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .populate(["user", "dishes"])
      .then(
        (favorites) => {
          res.statusCode = 200;
          res.setHeader("Content-type", "application/json");
          res.json(favorites);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then((user) => {
        if (user) {
          req.body.forEach((el) => {
            if (!user.dishes.some((objId) => objId.toString() === el._id)) {
              user.dishes.push(el._id);
            }
          });
          user.save().then(
            (favorites) => {
              res.statusCode = 200;
              res.setHeader("Content-type", "application/json");
              res.json(favorites);
            },
            (err) => next(err)
          );
        } else {
          Favorites.create({ user: req.user._id }).then(
            (userFavorites) => {
              req.body.forEach((el) => {
                userFavorites.dishes.push(el._id);
              });
              userFavorites.save().then((favorites) => {
                res.statusCode = 200;
                res.setHeader("Content-type", "application/json");
                res.json(favorites);
              });
            },
            (err) => next(err)
          );
        }
      })
      .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then((user) => {
        if (user) {
          user.remove().then((userFavorites) => {
            res.statusCode = 200;
            res.setHeader("Content-type", "application/json");
            res.json(userFavorites);
          });
        } else {
          err = new Error("There are not favorite dishes");
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

favoriteRouter.route("/:dishId")
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then((user) => {
        if (user) {
          if (
            !user.dishes.some((objId) => objId.toString() === req.params.dishId)
          ) {
            user.dishes.push(req.params.dishId);
          }
          user.save().then(
            (favorites) => {
              res.statusCode = 200;
              res.setHeader("Content-type", "application/json");
              res.json(favorites);
            },
            (err) => next(err)
          );
        } else {
          Favorites.create({ user: req.user._id }).then(
            (userFavorites) => {
              userFavorites.dishes.push(req.params.dishId);
              userFavorites.save().then((favorites) => {
                res.statusCode = 200;
                res.setHeader("Content-type", "application/json");
                res.json(favorites);
              });
            },
            (err) => next(err)
          );
        }
      })
      .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then((user) => {
        if (user) {
          var dish = user.dishes.find((el) => {
            return el.toString() === req.params.dishId;
          });
          if (dish) {
            user.dishes.splice(user.dishes.indexOf(dish), 1);
            user.save().then(
              (userFavorites) => {
                res.statusCode = 200;
                res.setHeader("Content-type", "application/json");
                res.json(userFavorites);
              },
              (err) => next(err)
            );
          } else {
            err = new Error("Dish not found in favorites");
            err.status = 404;
            return next(err);
          }
        } else {
          err = new Error("There are not favorite dishes");
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;