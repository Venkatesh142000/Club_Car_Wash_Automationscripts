Feature: Retail Wash Management

Scenario: Verify the Retail Washes page components are displayed
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Retail Washes page
  Then the Retail Washes page title is visible
  And the option to show inactive retail washes, search field, and search button are visible
  And the New Retail Wash button is visible

Scenario: Create and delete a Retail Wash
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Retail Washes page
  And the user enters a unique Retail Wash name
  And the user selects a generated wash type and active status
  And the user enters a generated price, selects taxable, and enters "These are the terms and conditions for the Test Retail Wash." as the terms and conditions
  Then the Create Retail Wash action is enabled
  When the user creates the Retail Wash
  Then a success message confirms the Retail Wash was created
  When the user opens the created Retail Wash from the list and deletes it
  Then a success message confirms the Retail Wash was deleted
  And the deleted Retail Wash is not shown in the list

Scenario: Create Retail Washes in bulk
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Retail Washes page
  And the user creates Retail Washes numbered 0 through 500 with rotating ROOKIE, VIP, ELITE, and MVP wash types
  And each Retail Wash has active status, a price matching its number to two decimal places, is taxable, and includes its specified terms and conditions
  Then the user returns to the All Retail Washes list after each Retail Wash is created
