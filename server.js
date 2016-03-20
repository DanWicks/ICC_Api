// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express          = require("express");        // call express
var app              = express();                 // define our app using express
var bodyParser       = require("body-parser");
var pg 		         = require("pg");
var connectionString = process.env.DATABASE_URL || "postgres://uwityljpwrsqju:OBnZlBE5jqpRFLUllAOfgpb8OA@ec2-54-83-22-48.compute-1.amazonaws.com:5432/dcji1sldavs0ts";
//
//var validExpression  = /(\%27)|(\")|(\-\-)|(\%23)|(#)/ix;

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();// get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	pg.defaults.ssl = true;
    // do logging    
    next(); // make sure we go to the next routes and don"t stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:3000/api)
router.get("/", function(req, res) {
	console.log("get request, oops");
    res.json({ "message": "GET Request Proccessed" });
});

// Staff information based on their ID
router.route("/staff_info_by_id").post(function(req,res) {	
	console.log("Staff info request...");
	pg.connect(connectionString, function(err, client, done) {
		if(err) {
			return console.error("Error: error fetching client from pool: ", err);
		}	
		var data = {"staff_id":req.body.staff_id};
		var results = [];	
		if(data.staff_id == null || data.staff_id == "") {
			return res.json({ "valid":false, "error":"No staff_id was found." });
		} else {
			var sqlString = "SELECT * " +
                  			"FROM Staff WHERE staff_id='"+data.staff_id+"';";                
			var queryResults = client.query(sqlString);

			queryResults.on("error", function(error) {
				console.log("Error occured: ", error.message);
				return res.json({ "valid":false,"error":error});
			});
			queryResults.on("row", function(row) {
				results.push(row);
			});
			queryResults.on("end", function() {
				for(var i = 0;i < results.length;i++) {
					delete results[i].password;
				}	
				done();
				return res.json({ "valid":true,"results":results });			
			});
		}		
	});
});
// Login functionality that will test to ensure the ID and password are present and correct in the database 
// Returns valid:false if the login info was incorrect
router.route("/staff_login").post(function(req,res) {		
	console.log("Login endpoint request...");
	pg.connect(connectionString, function(err, client, done) {
		if(err) {
			return console.error("Error: error fetching client from pool: ", err);
		}	
		var data = {"staff_id":req.body.staff_id, "password":req.body.password};
		var results = [];
		if(data.staff_id == null || data.staff_id == "") {
			return res.json({ "valid":false, "error":"No staff_id was found." });			
		} else if (data.password == null || data.password == "") {
		    return res.json({ "valid":false, "error":"No password was found." });
		} else {			
			var sqlString = "SELECT * " +
                  	"FROM Staff " + 
                  	"WHERE staff_id='"+data.staff_id+"' AND staff_password='"+data.password+"';";
			var queryResults = client.query(sqlString);

			queryResults.on("error", function(error) {
				console.log("Error occured: ", error.message);
				return res.json({ "valid":false,"error":error.message});
			});
			queryResults.on("row", function(row) {
				results.push(row);
			});
			queryResults.on("end", function() {
				done();
				if(results.length == 0) {				
					return res.json({ "valid":false,"error":"Invalid login information." });				
				} else {				
					for(var i = 0;i < results.length;i++) {
						delete results[i].password;
					}			
					return res.json({ "valid":true,"results":results });			
				}
			});
		}		
	});
});
// Get all of the scheduled buildings for a specific staff member on a specific day
router.route("/staff_schedule_by_id").post(function(req,res) {	
	console.log("Staff schedule request...");
	pg.connect(connectionString, function(err, client, done) {
		if(err) {
			return console.error("Error: error fetching client from pool: ", err);
		}	
		var data = {"staff_id":req.body.staff_id, "date":req.body.date};
		var results = [];	
		if(data.staff_id == null || data.staff_id == "") {
			return res.json({ "valid":false, "error":"No staff_id was sent in the request." });			
		} else if(data.date == null || data.date == "") {
			return res.json({ "valid":false, "error":"No date was sent in the request." });
		} else {
			var sqlString = "SELECT employee_schedule.schedule_date, employee_schedule.schedule_start, employee_schedule.schedule_end, " +
									"client_locations.client_address1, client_locations.client_address2, client_locations.city_id, " +
									"client_contracts.contract_requirements, specialty_equipment.specialty_equipment_description " +
                  			"FROM employee_schedule " +
                  			"INNER JOIN schedule_locations " +
                  			"   ON schedule_locations.schedule_id=employee_schedule.schedule_id " +
                  			"INNER JOIN sites" +
                  			"   ON sites.site_id=schedule_locations.site_id " +
                  			"INNER JOIN client_contracts" +
                  			"   ON sites.site_id=client_contracts.site_id " +
                  			"INNER JOIN client_locations" +
                  			"   ON sites.site_location_id=client_locations.location_id " +
                  			"INNER JOIN required_equipment" +
                  			"   ON client_contracts.requirements_id=required_equipment.requirements_id " +
                  			"LEFT JOIN specialty_equipment" +
                  			"   ON specialty_equipment.specialty_equipment_id=required_equipment.equipment_id " +
                  			"WHERE employee_schedule.staff_id='"+data.staff_id+"' AND employee_schedule.schedule_date='"+data.date+"';";
			var queryResults = client.query(sqlString);
			console.log(data.date, data.staff_id);
			queryResults.on("error", function(error) {
				console.log("Error occured: ", error.message);
				return res.json({ "valid":false,"error":error, "errorMessage":error.message});
			});
			queryResults.on("row", function(row) {
				results.push(row);
			});
			queryResults.on("end", function() {				
				done();
				return res.json({ "valid":true,"results":results });			
			});
		}		
	});
});
// Get all scheduled employees on a given date
router.route("/schedule_by_date").post(function(req,res) {	
	console.log("Schedule by date request...");
	pg.connect(connectionString, function(err, client, done) {
		if(err) {
			return console.error("Error: error fetching client from pool: ", err);
		}	
		var data = {"date":req.body.date};
		var results = [];	
		if(data.date == null || data.date == "") {
			return res.json({ "valid":false, "error":"No date sent in request." });			
		} else {
			var sqlString = "SELECT employee_schedule.schedule_date, employee_schedule.schedule_start, employee_schedule.schedule_end, " +
									"client_locations.client_address1, client_locations.client_address2, client_locations.city_id, " +
									"client_contracts.contract_requirements, specialty_equipment.specialty_equipment_description " +
                  			"FROM employee_schedule " +
                  			"INNER JOIN schedule_locations " +
                  			"   ON schedule_locations.schedule_id=employee_schedule.schedule_id " +
                  			"INNER JOIN sites" +
                  			"   ON sites.site_id=schedule_locations.site_id " +
                  			"INNER JOIN client_contracts" +
                  			"   ON sites.site_id=client_contracts.site_id " +
                  			"INNER JOIN client_locations" +
                  			"   ON sites.site_location_id=client_locations.location_id " +
                  			"INNER JOIN required_equipment" +
                  			"   ON client_contracts.requirements_id=required_equipment.requirements_id " +
                  			"LEFT JOIN specialty_equipment" +
                  			"   ON specialty_equipment.specialty_equipment_id=required_equipment.equipment_id " +
                  			"WHERE employee_schedule.schedule_date='"+data.date+"';";
			var queryResults = client.query(sqlString);

			queryResults.on("error", function(error) {
				console.log("Error occured: ", error.message);
				return res.json({ "valid":false,"error":error, "errorMessage":error.message});
			});
			queryResults.on("row", function(row) {
				results.push(row);
			});
			queryResults.on("end", function() {				
				done();
				return res.json({ "valid":true,"results":results });			
			});
		}		
	});
});
// Staff availability by their ID
router.route("/staff_availability_by_id").post(function(req,res) {	
	console.log("Availability by staff_id request...");
	pg.connect(connectionString, function(err, client, done) {
		if(err) {
			return console.error("Error: error fetching client from pool: ", err);
		}	
		var data = {"staff_id":req.body.staff_id};
		var results = [];	
		if(data.staff_id == null || data.staff_id == "") {
			return res.json({ "valid":false, "error":"No staff_id sent in request." });			
		} else {
			var sqlString = "SELECT *" +
                  			"FROM staff_availability " +
                  			"WHERE staff_availability.staff_id='"+data.staff_id+"';";
			var queryResults = client.query(sqlString);

			queryResults.on("error", function(error) {
				console.log("Error occured: ", error.message);
				return res.json({ "valid":false,"error":error, "errorMessage":error.message});
			});
			queryResults.on("row", function(row) {
				results.push(row);
			});
			queryResults.on("end", function() {				
				done();
				return res.json({ "valid":true,"results":results });			
			});
		}		
	});
});
// All staff available on a specific day
router.route("/staff_availability_by_date").post(function(req,res) {	
	console.log("Availability by date request...");
	pg.connect(connectionString, function(err, client, done) {
		if(err) {
			return console.error("Error: error fetching client from pool: ", err);
		}	
		var data = {"staff_id":req.body.staff_id};
		var results = [];	
		if(data.staff_id == null || data.staff_id == "") {
			return res.json({ "valid":false, "error":"No date sent in request." });			
		} else {
			var sqlString = "SELECT *" +
                  			"FROM staff_availability " +
                  			"WHERE staff_availability.sa_date_available='"+data.date+"';";
			var queryResults = client.query(sqlString);

			queryResults.on("error", function(error) {
				console.log("Error occured: ", error.message);
				return res.json({ "valid":false,"error":error, "errorMessage":error.message});
			});
			queryResults.on("row", function(row) {
				results.push(row);
			});
			queryResults.on("end", function() {			
				done();
				return res.json({ "valid":true,"results":results });			
			});
		}		
	});
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use("/api", router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log("Magic happens on port: " + port);