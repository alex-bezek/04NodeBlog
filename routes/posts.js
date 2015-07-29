var express = require('express');
var router = express.Router();
var multer = require('multer');
var mongo = require('mongodb');
var db = require('monk')('localhost/nodeblog');

//This was the way I got the multer to work, as opposed to how the tutorial said to do it
var upload = multer({ dest: './public/images/uploads'})
var cpUpload = upload.single('mainimage');

router.get('/add', function(req, res, next){
	var categories = db.get('categories');

	categories.find({},{}, function(err, categories){
		res.render('addpost',{
			"title": "Add Post",
			"categories": categories
		});
	});
});

router.get('/show/:id', function(req, res, next){
	var posts = db.get('posts');
	posts.findById(req.params.id, function(err, post){
		console.log('Found this post: ', post);
		res.render('show',{
			"post": post
		});
	});
})

router.post('/addcomment', function(req, res, next){
	// Get Form Values
	var name		= req.body.name;
	var email 		= req.body.email;
	var body 		= req.body.body;
	var postid 		= req.body.postid;
	var commentdate = new Date();
	console.log('Add comment req body: ', req.body);

	// Form Validation
	req.checkBody('name','Name field is required').notEmpty();
	req.checkBody('email','Email field is required').notEmpty();
	req.checkBody('email','Email is not formatted correctly').isEmail();
	req.checkBody('body', 'Body field is required').notEmpty();

	// Check Errors
	var errors = req.validationErrors();

	if(errors){
		var posts = db.get('posts');
		posts.findById(postid, function(err, post){
			res.render('show',{
				"errors": errors,
				"post": post
			});
		});
		
	} else {
		var comment = {"name": name, "email": email, "body": body, "commentdate": commentdate}
		console.log('About to post this comment: ', comment);
		var posts = db.get('posts');

		posts.updateById(postid.toString(),
			{
				$push:{
					"comments":comment
				}
			},
			function(err, doc){
				if(err){
					throw err;
				} else {
					req.flash('success','Comment Added');
					res.location('/posts/show/'+postid);
					res.redirect('/posts/show/'+postid);
				}
			}
		);
	}
});

router.post('/add',cpUpload , function(req, res, next){
	console.log(req.body, req.file);

	// Get Form Values
	var title 		= req.body.title;
	var category 	= req.body.category;
	var body 		= req.body.body;
	var author 		= req.body.author;
	var date 		= new Date();

	if(req.file){
		console.log('FOUND THIS FILE');
		console.log('file: ',  req.file);
		var mainImageOriginalName 	= req.file.originalname;
		var mainImageName 			= req.file.filename;
		var mainImageMime    		= req.file.mimetype;
		var mainImagePath    		= req.file.path;
		var mainImageExt    		= req.file.extension;
		var mainImageSize    		= req.file.size;
	} else {
		console.log('No Image Found!!');
		var mainImageName = 'noimage.png';
	}

	// Form Validation
	req.checkBody('title','Title field is required').notEmpty();
	req.checkBody('body', 'Body field is required');

	// Check Errors
	var errors = req.validationErrors();

	if(errors){
		console.log('Found Form validation errors');
		console.log(errors);
		res.render('addpost',{
			"errors": errors,
			"title": title,
			"body": body
		});
	} else {
		console.log('No validation errors');
		var posts = db.get('posts');

		// Submit to DB
		posts.insert({
			"title": title,
			"body": body,
			"category": category,
			"date": date,
			"author": author,
			"mainimage": mainImageName
		}, function(err, post){
			if(err){
				res.send('There was an issue submitting the post');
			} else {
				req.flash('success','Post Submitted');
				res.location('/');
				res.redirect('/');
			}
		});
	}
});

module.exports = router;