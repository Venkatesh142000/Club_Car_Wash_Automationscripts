import { test } from '../fixtures/baseFixture.js';
import helpers from '../utils/helpers.js';

test.describe("RESTful Booker API - E2E Test Flow (GET, POST, DELETE)", () => {


    let bookingId;
    
    let bookingPayLoad;

    test("1-POST - Create booking with payload builder", async ({ apiClient, payLoader}) => {
        await helpers.allureEpicLabel("Booking API");
        await helpers.allureFeatureLabel("POST Booking");
        await helpers.allureSeverity("critical");

       


       bookingPayLoad = payLoader.buildBooking();
        

        await helpers.allureStep("Send POST /booking request");
        const response = await apiClient.post('/booking', bookingPayLoad);

        const status = response.status();

        await helpers.allureStep(`Response status: ${status}`);

        if (status >= 400) {
            const responseText = await response.text();
            console.log('❌ Error response:', responseText);
            await helpers.allureStep(`Error response: ${responseText}`);
        }

        const isValidStatus = await helpers.validatePostResponseStatusCode(status);
        helpers.assertTruthy({ value: isValidStatus });

        const createdBooking = await response.json();
        console.log("createdBooking:", createdBooking);

        helpers.assertTruthy({ value: createdBooking.bookingid });
        await helpers.allureStep(`Booking created with ID: ${createdBooking.bookingid}`);
        

         bookingId = createdBooking.bookingid;
        return createdBooking.bookingid;
    });

    test("2-GET - Retrieve all bookings", async ({ apiClient }) => {
        await helpers.allureEpicLabel("Booking API");
        await helpers.allureFeatureLabel("GET Bookings");
        await helpers.allureSeverity("normal");

        await helpers.allureStep("Send GET /booking request");
        const response = await apiClient.get('/booking');
        const status = response.status();

        const isValidStatus = await helpers.validateGetResponseStatusCode(status);
        helpers.assertTruthy({ value: isValidStatus });

        const bookings = await response.json();

        helpers.assertTruthy({ value: Array.isArray(bookings) });
        await helpers.allureStep(`Total bookings retrieved: ${bookings.length}`);

        if (bookings.length > 0) {
            const firstBooking = bookings[0];
            helpers.assertTruthy({ value: firstBooking.bookingid });
            await helpers.allureStep(`First booking ID: ${firstBooking.bookingid}`);
        }
    });

    test("3-GET - Retrieve specific booking by ID", async ({ apiClient, payLoader }) => {
        await helpers.allureEpicLabel("Booking API");
        await helpers.allureFeatureLabel("GET Booking by ID");
        await helpers.allureSeverity("critical");

        const bookingPayload = payLoader.buildBooking();

        await helpers.allureStep("Create a booking via POST");
        const postResponse = await apiClient.post('/booking', bookingPayload);
        const postStatus = postResponse.status();

        if (postStatus >= 400) {
            const errorText = await postResponse.text();
            console.log('❌ POST Error:', errorText);
            await helpers.allureStep(`POST error: ${errorText}`);
        }

        const createdBooking = await postResponse.json();
        const bookingId = createdBooking.bookingid;
        helpers.assertTruthy({ value: bookingId });
        await helpers.allureStep(`Created booking ID: ${bookingId}`);

        await helpers.allureStep(`Send GET /booking/${bookingId}`);
        const getResponse = await apiClient.get(`/booking/${bookingId}`);
        const getStatus = getResponse.status();

        const isValidStatus = await helpers.validateGetResponseStatusCode(getStatus);
        helpers.assertTruthy({ value: isValidStatus });

        const retrievedBooking = await getResponse.json();

        const firstnameMatch = await helpers.validateResponseBodyValue(bookingPayload.firstname, retrievedBooking.firstname);
        const lastnameMatch = await helpers.validateResponseBodyValue(bookingPayload.lastname, retrievedBooking.lastname);
        const priceMatch = await helpers.validateResponseBodyValue(bookingPayload.totalprice, retrievedBooking.totalprice);

        helpers.assertTruthy({ value: firstnameMatch });
        helpers.assertTruthy({ value: lastnameMatch });
        helpers.assertTruthy({ value: priceMatch });

        await helpers.allureStep(`Booking validated: ${retrievedBooking.firstname} ${retrievedBooking.lastname}`);

        return bookingId;
    });

    test("4-DELETE - Remove booking", async ({ apiClient, payLoader}) => {
        await helpers.allureEpicLabel("Booking API");
        await helpers.allureFeatureLabel("DELETE Booking");
        await helpers.allureSeverity("critical");

     


        await helpers.allureStep(`Send DELETE /booking/${bookingId}`);
        const deleteResponse = await apiClient.delete(`/booking/${bookingId}`);
        const deleteStatus = deleteResponse.status();

        await helpers.validateDeleteResponseStatusCode(deleteStatus);

    });

    test("5-PATCH - Update existing booking", async ({ apiClient, payLoader}) => {
        await helpers.allureEpicLabel("Booking API");
        await helpers.allureFeatureLabel("PUT Booking");
        await helpers.allureSeverity("normal");

      
       bookingPayLoad.firstname="Updated First Name";





        await helpers.allureStep("Create a booking via POST");
        const postResponse = await apiClient.patch('/booking', bookingPayLoad);
        const postStatus = postResponse.status();

        
        return bookingId;
    });

});