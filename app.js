//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Creating todolistDB
mongoose.set("strictQuery", true);
mongoose.connect(
  "mongodb+srv://Nikhil:Nikhil123@cluster0.cqqpevq.mongodb.net/todolistDB",
  function () {
    console.log("Connected to MongoDB");
  }
);

// Creating items Schema
const itemsSchema = new mongoose.Schema({
  name: String,
});

// Creating Model
const Item = mongoose.model("Item", itemsSchema);

// Creating Document based on Item model
const item1 = new Item({
  name: "Buy Food",
});
const item2 = new Item({
  name: "Cook Food",
});
const item3 = new Item({
  name: "Eat Food",
});

// Putting all docs inside an Array
const defaultItems = [item1, item2, item3];
//Custom list Schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});
// ----------------------------------------------------------------
// Custom list model

const List = mongoose.model("List", listSchema);
// Inserting this array inside Item collection
// Item.insertMany(defaultItems,function(err){
//   if(err){
//     console.log(err);
//   }
//   else{
// console.log("Successfully inserted");
//   }
// });
// ----------------------------------------------------------------
// Making Home page
app.get("/", function (req, res) {
  // Finding all the values which is inside collection
  // and passing them to list.ejs file

  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});
// ----------------------------------------------------------------
// Creating Custom todoList

app.get("/:customlist", function (req, res) {
  const customListName = _.capitalize(req.params.customlist);
  List.findOne({ name: customListName }, function (err, foundlist) {
    if (!foundlist) {
      //creating new list
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      //show an existing list
      res.render("list", {
        listTitle: foundlist.name,
        newListItems: foundlist.items,
      });
    }
  });
});
// ----------------------------------------------------------------
// Adding new item

app.post("/", function (req, res) {
  // getting the new item from form in list.ejs file
  const itemName = req.body.newItem;
  const listName = req.body.list;
  // Creating document with new item added in todolist
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    // Saving this new item to db
    item.save();
    //Passing this item to home route
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundlist) {
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/" + listName);
    });
  }
});
// ----------------------------------------------------------------
// Deleting checked item

app.post("/delete", function (req, res) {
  // Getting name of list to redirect to it after deleting item
  const listName = req.body.listname;
  // Getting id of check item
  const checkedItemId = req.body.check;
  if (listName === "Today") {
  // Removing item which is checked using id
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started");
});
