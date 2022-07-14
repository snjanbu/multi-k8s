const keys = require("./keys.js");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const bodyParse = require("body-parser");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const { Pool } = require("pg");
const pgClient = new Pool({
	"host": keys.pgHost,
	"port": keys.pgPort,
	"user": keys.pgUser,
	"database": keys.pgDatabase,
	"password": keys.pgPassword,
});

let called = false;

pgClient.on("connect", async (client) => {
	console.log("INITIATING CONNECTION REQUEST FOR PG");
	await pgClient.query("set enable_parallel_hash=off;CREATE TABLE IF NOT EXISTS values (number INT);").then(() => {
		console.log("PG CONNECTED SUCCESSFULLY 27101995");
	}).catch((err) => {
		console.log(err, "ERROR WHILE CONNECTING 27101995")
	})
});

const redis = require("redis");
const redisClient = redis.createClient({
	"host": keys.redisHost,
	"port": keys.redisPort,
	"retry_strategy": () => 1000,
});

const redisPublisher = redisClient.duplicate();

redisClient.on("ready", () => {
	console.log("REDIS READY TO ACCEPt CONNECTIONS 27101995")
});

app.get("/values/all", async (req, res) => {
	console.log("SELECTING ALL VALUES 27101995 INITIATE");
	const values = await pgClient.query("SELECT * from values").catch((err) => {
		console.log("ERROR WHILE FETCHING ALL VALUES 27101995", err);
	});
	console.log("SELECTING ALL VALUES 27101995", values.rows);
	res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
	console.log("SELECTING CURRENT VALUES 27101995");
	redisClient.hgetall("values", (err, values) => {
		console.log("SELECTING CURRENT VALUES 27101995", values, "ERROR", err);
		res.send(values);
	});
});

app.post("/values", async (req, res) => {
	const index = req.body.index;

	if (+index > 40) {
		return res.status(422).send("Index too high");
	}

	redisClient.hset("values", index, "Nothing Yet!");
	redisPublisher.publish("insert", index);
	pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
	console.log("INSERTING VALUES 27101995", [index]);
	res.send({ "working": true });
});

app.get("/", (req, res) => {
	res.send("hi");
});

app.listen(5000, (err) => {
	console.log("App listening on 5000");
});