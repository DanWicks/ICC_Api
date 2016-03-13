// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express          = require("express");        // call express
var app              = express();                 // define our app using express
var bodyParser       = require("body-parser");
var pg 		         = require("pg");
var connectionString = "postgres://redline_admin:password@localhost/icc_project";
//var validExpression  = /(\%27)|(\")|(\-\-)|(\%23)|(#)/ix;

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();// get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log("Request received...");
    next(); // make sure we go to the next routes and don"t stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:3000/api)
router.get("/", function(req, res) {
    res.json({ "message": "GET Request Proccessed" });
});

// more routes for our API will happen here
router.route("/staff_info_by_id").post(function(req,res) {	
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
                  			"FROM Staff;";                
			var queryResults = client.query(sqlString);

			queryResults.on("error", function(error) {
				return res.json({ "valid":false,"error":error});
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
// more routes for our API will happen here
router.route("/staff_login").post(function(req,res) {		
	console.log("Login endpoint request...");
	pg.connect(connectionString, function(err, client, done) {
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
			console.log("Login Attempt: " + "ID: " + data.staff_id + " PASS: " + data.password);
			var sqlString = "SELECT * " +
                  	"FROM Staff " + 
                  	"WHERE staff_id='"+data.staff_id+"' AND staff_password='"+data.password+"';";
			var queryResults = client.query(sqlString);

			queryResults.on("error", function(error) {
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
				return res.json({ "valid":true,"results":results });			
			}
			});
		}		
	});
});
// more routes for our API will happen here
router.route("/staff_schedule_by_id").post(function(req,res) {	
	pg.connect(connectionString, function(err, client, done) {
		if(err) {
			return console.error("Error: error fetching client from pool: ", err);
		}	
		var data = {"staff_id":req.body.staff_id, "date":req.body.date};
		var results = [];	
		if(data.staff_id == null || data.staff_id == "") {
			return res.json({ "valid":false, "error":"No staff_id was found." });			
		} else {
			var sqlString = "SELECT employee_schedule.schedule_date, employee_schedule.schedule_start, employee_schedule.schedule_end, " +
									"client_locations.cl_address1, client_locations.cl_address2, client_locations.cl_city, " +
									"client_contracts.con_requirements, speciality_equipment.sp_equip_id " +
                  			"FROM employee_schedule " +
                  			"INNER JOIN schedule_locations " +
                  			"   ON schedule_locations.schedule_id=employee_schedule.schedule_id " +
                  			"INNER JOIN sites" +
                  			"   ON sites.site_id=employee_schedule.site_id " +
                  			"INNER JOIN client_contracts" +
                  			"   ON sites.site_id=client_contracts.site_id " +
                  			"INNER JOIN client_locations" +
                  			"   ON sites.site_id=client_locations.site_id " +
                  			"INNER JOIN required_equipment" +
                  			"   ON client_contracts.requirements_id=required_equipment.requirements_id " +
                  			"INNER JOIN speciality_equipment" +
                  			"   ON speciality_equipment.equipment_id=required_equipment.equipment_id " +
                  			"WHERE employee_schedule.staff_id="+data.staff_id+" AND employee_schedule.date="+data.date+";";
			var queryResults = client.query(sqlString);

			queryResults.on("error", function(error) {
				return res.json({ "valid":false,"error":error});
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