Feature: Site Management

Scenario: Create a site
  Given the user is logged in
  When the user opens Sites
  And the user starts creating a new site
  And the user enters a generated site ID and site name
  And the user selects the Test site type
  And the user enters generated address lines, city, and ZIP code
  And the user selects Alabama as the state
  And the user creates the site
  Then a success message confirms the site was created

Scenario: Create a site with merchant details
  Given the user is logged in
  When the user opens Sites
  And the user starts creating a new site
  And the user enters a generated site ID and site name
  And the user selects the Test site type
  And the user enters generated address lines, city, and ZIP code
  And the user selects New York as the state
  And the user enters a generated merchant ID and merchant username
  And the user creates the site
  Then a success message confirms the site was created

Scenario: Update site details
  Given the user is logged in
  And a Test site is created with a generated ID, name, address lines, city, Massachusetts state, and ZIP code
  Then a success message confirms the site was created
  When the user opens the site details
  And the user changes the site name by adding "Updated "
  And the user updates the first address line, city, and ZIP code with generated values
  And the user saves the site details
  Then a success message confirms the site was updated

Scenario: Delete a site
  Given the user is logged in
  And a Test site is created with a generated ID, name, address lines, city, California state, and ZIP code
  Then a success message confirms the site was created
  When the user deletes the created site
  Then a success message confirms the site was deleted
