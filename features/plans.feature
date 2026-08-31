Feature: Plan Management

Scenario: Verify the Plans page components are displayed
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Plans page
  Then the Plans page title is visible
  And the option to show inactive plans, search field, and search button are visible
  And the New Plan button is visible
  And the Plan Name, Plan Type, Reload Type, Period, and Unit Quantity headers are visible

Scenario: Create a time-based plan
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Plans page
  And the user starts creating a new plan
  And the user enters a unique plan name
  And the user selects the Time-Based plan type, a generated wash type, signature enabled, and active status
  And the user enters a generated plan period, wash limit, and price
  And the user enters "These are the terms and conditions for the Test Plan." as the terms and conditions
  And the user creates the plan
  Then a success message confirms the plan was created

Scenario: Create and edit a time-based plan
  Given the user is logged in
  When the user creates a Time-Based active plan with a generated name, wash type, plan period, wash limit, price, and "Terms for E2E plan." as its terms and conditions
  Then a success message confirms the plan was created
  When the user opens the created plan from the All Plans list
  And the user changes the plan name by adding " - Edited"
  And the user saves the changes
  Then a success message confirms the plan was updated
  And the updated plan is visible in the list

Scenario: Create and delete a time-based plan
  Given the user is logged in
  When the user creates a Time-Based active plan with a generated name, wash type, plan period, wash limit, price, and "Terms for delete test." as its terms and conditions
  Then a success message confirms the plan was created
  When the user opens the created plan from the All Plans list
  And the user deletes the plan
  Then a success message confirms the plan was deleted
  And the deleted plan is not shown in the list

Scenario: Create a unit-based plan
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Plans page
  And the user starts creating a new plan
  And the user enters a unique plan name
  And the user selects the Unit Based plan type, a generated wash type, signature enabled, and active status
  And the user enters a generated unit quantity and price
  And the user enters "These are the terms and conditions for the Test Plan." as the terms and conditions
  And the user creates the plan
  Then a success message confirms the plan was created

Scenario: Create plans in bulk with dynamic data
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Plans page
  And the user creates plans 307 through 372 with unique names, random wash types, wash limits from 2 through 9, and prices from 1 through 500
  And each plan is Time-Based, has signature enabled and active status, has a 12-period duration, auto-recharge enabled, a wash limit for the plan duration, is taxable, and includes the specified terms and conditions
  Then the user returns to the All Plans list after each plan is created
