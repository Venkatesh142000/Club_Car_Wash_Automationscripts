Feature: Add-Ons Management

Scenario: Verify the Add-Ons page components are displayed
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Add-Ons page
  Then the Add-Ons page title is visible
  And the option to show inactive items is visible
  And the search field is visible and enabled
  And the New Add-On button is visible
  And the Add-On Name, Price, and Status column headers are visible
  And at least one Add-On row is displayed

Scenario: Verify the New Add-On form opens
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Add-Ons page
  And the user opens the New Add-On form
  Then the Add-On Name field is visible
  And the Add-On Component selector is visible
  And the Price field is visible
  And the Taxable selector is visible
  And the Create Add-On button is visible

Scenario: Verify the Add-On table is displayed
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Add-Ons page
  Then the Add-On table is available

Scenario: Login and create an Add-On
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Add-Ons page
  And the user opens the New Add-On form
  And the user enters a unique Add-On name
  And the user selects an Add-On component
  And the user enters a price
  And the user creates the Add-On
  Then a success message confirms the Add-On was created
  And the user returns to the Add-Ons list

Scenario: Login and create an Add-On with a scheduled price
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Add-Ons page
  And the user opens the New Add-On form
  And the user enters a unique Add-On name
  And the user selects an Add-On component
  And the user enters a price
  And the user enables scheduled pricing
  And the user enters the scheduled price
  And the user creates the Add-On
  Then a success message confirms the Add-On was created

Scenario: Create and edit an Add-On
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Add-Ons page
  And the user opens the New Add-On form
  And the user enters a unique Add-On name
  And the user selects an Add-On component
  And the user enters a price
  And the user creates the Add-On
  And the user opens the created Add-On from the list
  And the user edits the Add-On name
  And the user saves the changes
  Then a success message confirms the Add-On was updated
  And the updated Add-On name is visible in the list

Scenario: Create and delete an Add-On
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Add-Ons page
  And the user opens the New Add-On form
  And the user enters a unique Add-On name
  And the user selects an Add-On component
  And the user enters a price
  And the user creates the Add-On
  And the user opens the created Add-On from the list
  And the user deletes the Add-On
  Then the Add-On no longer appears in the list

Scenario: Create many Add-Ons in bulk
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Add-Ons page
  And the user repeatedly creates Add-Ons with unique names, rotating components, and increasing prices
  Then each Add-On is created successfully
