package com.edutech.eventmanagementsystem;

import com.edutech.eventmanagementsystem.dto.LoginRequest;
import com.edutech.eventmanagementsystem.entity.Allocation;
import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Resource;
import com.edutech.eventmanagementsystem.entity.User;
import com.edutech.eventmanagementsystem.repository.AllocationRepository;
import com.edutech.eventmanagementsystem.repository.EventRepository;
import com.edutech.eventmanagementsystem.repository.ResourceRepository;
import com.edutech.eventmanagementsystem.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.assertj.core.util.Lists;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import javax.transaction.Transactional;
import java.util.List;

import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
class EventManagementSystemApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private AllocationRepository allocationRepository;

	@Autowired
	private ResourceRepository resourceRepository;

	@Autowired
	private EventRepository eventRepository;

	@BeforeEach
	public void setUp() {
		// Clear the database before each test
		userRepository.deleteAll();
		eventRepository.deleteAll();
		resourceRepository.deleteAll();
		allocationRepository.deleteAll();
	}

	@Test
	public void testRegisterUser() throws Exception {
		// Create a User object for registration
		User user = new User();
		user.setUsername("testUser");
		user.setPassword("testPassword");
		user.setEmail("test@example.com");
		user.setRole("PLANNER");

		// Perform a POST request to the /register endpoint using MockMvc
		mockMvc.perform(post("/api/user/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsBytes(user)))
				.andExpect(jsonPath("$.username").value(user.getUsername()))
				.andExpect(jsonPath("$.email").value(user.getEmail()))
				.andExpect(jsonPath("$.role").value(user.getRole()));

		// Assert business is created in the database
		User savedUser = userRepository.findAll().get(0);
		assertEquals(user.getUsername(), savedUser.getUsername());
		assertEquals(user.getEmail(), savedUser.getEmail());
		assertEquals(user.getRole(), savedUser.getRole());
	}

	@Test
	public void testLoginUser() throws Exception {
		// Create a user for registration
		User user = new User();
		user.setUsername("testUser");
		user.setPassword("password");
		user.setRole("PLANNER");
		user.setEmail("testUser@gmail.com");
		// Register the user
		mockMvc.perform(post("/api/user/register")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(user)));

		// Login with the registered user
		LoginRequest loginRequest = new LoginRequest("testUser", "password");

		mockMvc.perform(post("/api/user/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(jsonPath("$.token").exists());
	}

	@Test
	public void testLoginWithWrongUsernameOrPassword() throws Exception {
		// Create a login request with a wrong username
		LoginRequest loginRequest = new LoginRequest("wronguser", "password");

		mockMvc.perform(post("/api/user/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(loginRequest)))
				.andExpect(status().isUnauthorized()); // Expect a 401 Unauthorized response
	}

	@Test
	@WithMockUser(authorities = "PLANNER")
	public void testCreateEvent() throws Exception {
		// Create a sample event payload
		Event event = new Event();
		event.setTitle("Sample Event");
		event.setDescription("Sample Description");
		// Set other event details...

		// Convert event object to JSON
		String eventJson = objectMapper.writeValueAsString(event);

		// Perform the POST request to create an event
		mockMvc.perform(post("/api/planner/event")
						.contentType(MediaType.APPLICATION_JSON)
						.content(eventJson))
				.andExpect(jsonPath("$.eventID").exists())
				.andExpect(jsonPath("$.description").value("Sample Description"))
				.andExpect(jsonPath("$.title").value("Sample Event"));


		Event retrievedEvent = eventRepository.findAll().get(0);
		assertNotNull(retrievedEvent);
		assertEquals(retrievedEvent.getDescription(), event.getDescription());
	}

	@Test
	@WithMockUser(authorities = "PLANNER")
	public void testGetAllEvents() throws Exception {
		// Create a sample event
		Event event = new Event();
		event.setTitle("Sample Event");
		event.setDescription("Sample Description");
		event = eventRepository.save(event);

		Event event2 = new Event();
		event2.setTitle("Sample Event");
		event2.setDescription("Sample Description");
		event2 = eventRepository.save(event2);

		ResultActions resultActions = mockMvc.perform(get("/api/planner/events")
						.contentType(MediaType.APPLICATION_JSON))
				.andExpect(content().contentType(MediaType.APPLICATION_JSON));

		// Extract the response content
		String responseContent = resultActions.andReturn().getResponse().getContentAsString();

		// Deserialize the response content into a list of events
		List<Event> events = objectMapper.readValue(responseContent, new TypeReference<>() {});
		 assertThat(events).hasSize(2);
		 assertThat(events.get(0).getTitle()).isEqualTo(event.getTitle());
		assertThat(events.get(0).getDescription()).isEqualTo(event.getDescription());
		 assertThat(events.get(1).getTitle()).isEqualTo(event2.getTitle());
		assertThat(events.get(1).getDescription()).isEqualTo(event2.getDescription());
	}

	@Test
	@WithMockUser(authorities = "PLANNER")
	public void testAddResource() throws Exception {
		// Arrange: Create a test resource, serialize it to JSON
		Resource testResource = new Resource();
		testResource.setName("Test Resource");
		testResource.setType("Equipment");
		testResource.setAvailability(true);
		String resourceJson = objectMapper.writeValueAsString(testResource);

		 mockMvc.perform(post("/api/planner/resource")
						.contentType(MediaType.APPLICATION_JSON)
						.content(resourceJson))
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.name").value("Test Resource"))
				.andExpect(jsonPath("$.type").value("Equipment"))
				.andExpect(jsonPath("$.availability").value(true));

		Resource retrievedResource = resourceRepository.findAll().get(0);
		assertNotNull(retrievedResource);
		assertEquals(retrievedResource.getName(), testResource.getName());
		assertEquals(retrievedResource.getType(), testResource.getType());
		assertEquals(retrievedResource.isAvailability(), testResource.isAvailability());
	}

	@Test
	@WithMockUser(authorities = "PLANNER")
	public void testGetAllResources() throws Exception {
		Resource resource = new Resource();
		resource.setName("Test Resource");
		resource.setType("Equipment");
		resource.setAvailability(true);
		resource = resourceRepository.save(resource);

		Resource resource1 = new Resource();
		resource1.setName("Test Resource 1");
		resource1.setType("Equipment 1");
		resource1.setAvailability(true);
		resource1 = resourceRepository.save(resource1);

		ResultActions resultActions = mockMvc.perform(get("/api/planner/resources")
						.contentType(MediaType.APPLICATION_JSON))
				.andExpect(content().contentType(MediaType.APPLICATION_JSON));

		// Extract the response content
		String responseContent = resultActions.andReturn().getResponse().getContentAsString();

		// Deserialize the response content into a list of events
		List<Resource> resources = objectMapper.readValue(responseContent, new TypeReference<>() {});
		assertThat(resources).hasSize(2);
		assertThat(resources.get(0).getName()).isEqualTo(resource.getName());
		assertThat(resources.get(0).getType()).isEqualTo(resource.getType());
		assertThat(resources.get(0).isAvailability()).isEqualTo(resource.isAvailability());
		assertThat(resources.get(1).getName()).isEqualTo(resource1.getName());
		assertThat(resources.get(1).getType()).isEqualTo(resource1.getType());
		assertThat(resources.get(1).isAvailability()).isEqualTo(resource1.isAvailability());
	}

	@Test
	@WithMockUser(authorities = "PLANNER")
	public void testAllocateResources() throws Exception {
		Event testEvent = new Event();
		testEvent.setTitle("Test Event");
		testEvent.setDescription("Test Description");
		testEvent.setLocation("Test Location");
		testEvent.setAllocations(Lists.newArrayList());
		testEvent = eventRepository.save(testEvent);

		Resource testResource = new Resource();
		testResource.setName("Test Resource");
		testResource.setType("Equipment");
		testResource.setAvailability(true);
		testResource = resourceRepository.save(testResource);

		// Create a test allocation
		Allocation testAllocation = new Allocation();
		testAllocation.setQuantity(10);

		mockMvc.perform(post("/api/planner/allocate-resources")
						.contentType(MediaType.APPLICATION_JSON)
						.param("eventId", testEvent.getEventID().toString())
						.param("resourceId", testResource.getResourceID().toString())
						.content(objectMapper.writeValueAsString(testAllocation)));

		Event allocatedEvent = eventRepository.findById(testEvent.getEventID()).get();
		assertEquals(allocatedEvent.getAllocations().get(0).getQuantity(), testAllocation.getQuantity());
		assertEquals(allocatedEvent.getAllocations().get(0).getResource().getResourceID(), testResource.getResourceID());
        assertFalse(allocatedEvent.getAllocations().get(0).getResource().isAvailability());
	}

	@Test
	@WithMockUser(authorities = "STAFF")
	public void testStaffShouldGetEventDetails() throws Exception {
		Event testEvent = new Event();
		testEvent.setTitle("Test Event");
		testEvent.setDescription("Test Description");
		testEvent.setLocation("Test Location");
		Event savedEvent = eventRepository.save(testEvent);

		 mockMvc.perform(get("/api/staff/event-details/{eventId}", savedEvent.getEventID())
						.contentType(MediaType.APPLICATION_JSON))
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.title").value("Test Event"))
				.andExpect(jsonPath("$.description").value("Test Description"));
	}

	@Test
	@WithMockUser(authorities = "STAFF")
	public void testStaffShouldUpdateEventSetup() throws Exception {
		// Arrange: Create a test event in the database or use data.sql to insert test data
		Event testEvent = new Event();
		testEvent.setTitle("Test Event");
		testEvent.setDescription("Test Description");
		testEvent.setLocation("Test Location");
		Event savedEvent = eventRepository.save(testEvent);

		// Create an updated event setup
		Event updatedEvent = new Event();
		updatedEvent.setTitle("Updated Event Title");
		updatedEvent.setDescription("Updated Event Description");
		updatedEvent.setLocation("Updated Event Location");

		mockMvc.perform(put("/api/staff/update-setup/{eventId}", savedEvent.getEventID())
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(updatedEvent)))
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.title").value("Updated Event Title"))
				.andExpect(jsonPath("$.description").value("Updated Event Description"));

		Event retrievedEvent = eventRepository.findById(savedEvent.getEventID()).get();
		assertEquals(retrievedEvent.getTitle(), updatedEvent.getTitle());
		assertEquals(retrievedEvent.getDescription(), updatedEvent.getDescription());
	}

	@Test
	@WithMockUser(authorities = "CLIENT")
	public void testClientShouldGetBookingDetails() throws Exception {
		Event testEvent = new Event();
		testEvent.setTitle("Test Event");
		testEvent.setDescription("Test Description");
		testEvent.setLocation("Test Location");
		Event savedEvent = eventRepository.save(testEvent);

		mockMvc.perform(get("/api/client/booking-details/{eventId}", savedEvent.getEventID())
						.contentType(MediaType.APPLICATION_JSON))
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.title").value("Test Event"))
				.andExpect(jsonPath("$.description").value("Test Description"));
	}

	@Test
	@WithMockUser(authorities = {"STAFF", "CLIENT"})
	public void testStaffAndClientShouldNotAccessPlannerApi() throws Exception {
		mockMvc.perform(post("/api/planner/event")
						.contentType(MediaType.APPLICATION_JSON)
						.content(""))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/planner/events")
						.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/planner/resource")
						.contentType(MediaType.APPLICATION_JSON)
						.content(""))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/planner/resources")
						.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/planner/allocate-resources")
						.contentType(MediaType.APPLICATION_JSON)
						.param("eventId", "1")
						.param("resourceId", "1")
						.content(""))
				.andExpect(status().isForbidden());
	}


	@Test
	@WithMockUser(authorities = {"PLANNER", "CLIENT"})
	public void testPlannerAndClientShouldNotAccessStaffApi() throws Exception {
		mockMvc.perform(get("/api/staff/event-details/{eventId}", 1)
						.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/staff/update-setup/{eventId}", 1)
						.contentType(MediaType.APPLICATION_JSON)
						.content(""))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(authorities = {"PLANNER", "STAFF"})
	public void testPlannerAndStaffShouldNotAccessClientApi() throws Exception {
		mockMvc.perform(get("/api/client/booking-details/{eventId}", 1)
						.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isForbidden());
	}



}
