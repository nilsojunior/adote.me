const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const UserController = require("../controllers/UserController");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const router = require("express").Router();
router.post("/login", UserController.login);
app.use("/users", router);

describe("User Login", () => {
    let testUser;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect("mongodb://localhost:27017/adoteme");

        // Create a test user
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash("testpassword123", salt);

        testUser = new User({
            name: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            password: passwordHash,
        });
        await testUser.save();
    }, 10000);

    afterAll(async () => {
        if (mongoose.connection.readyState === 1) {
            await User.deleteOne({ email: "test@example.com" });
            await mongoose.connection.close();
        }
    }, 10000);

    test("should login successfully with valid credentials", async () => {
        const response = await request(app).post("/users/login").send({
            email: "test@example.com",
            password: "testpassword123",
        });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe(
            "Autenticação realizada com sucesso!",
        );
        expect(response.body.token).toBeDefined();
        expect(response.body.userId).toBeDefined();
    });

    test("should fail with invalid email", async () => {
        const response = await request(app).post("/users/login").send({
            email: "wrong@example.com",
            password: "testpassword123",
        });

        expect(response.status).toBe(422);
        expect(response.body.message).toBe("Usuário não encontrado!");
    });

    test("should fail with invalid password", async () => {
        const response = await request(app).post("/users/login").send({
            email: "test@example.com",
            password: "wrongpassword",
        });

        expect(response.status).toBe(422);
        expect(response.body.message).toBe("Usuário não encontrado!");
    });

    test("should fail when email is missing", async () => {
        const response = await request(app).post("/users/login").send({
            password: "testpassword123",
        });

        expect(response.status).toBe(422);
        expect(response.body.message).toBe("Insira um email");
    });

    test("should fail when password is missing", async () => {
        const response = await request(app).post("/users/login").send({
            email: "test@example.com",
        });

        expect(response.status).toBe(422);
        expect(response.body.message).toBe("Insira uma senha");
    });
});
