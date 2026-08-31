Feature: Product Management

Scenario: Verify the Products page components are displayed
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Products page
  Then the Products page title, inactive-items option, search field, and New Product button are visible
  And the Product Name, Type, Price, and Status headers are visible
  And at least one product row is displayed

Scenario: Verify the New Product form opens
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Products page
  And the user starts creating a new product
  Then the Product Name, Product Type, and Product Status fields are visible
  And the Create Product button is visible

Scenario: Verify the Products table is displayed
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Products page
  Then the Products table is available

Scenario: Create a Gift Card product
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Products page
  And the user creates a Gift Card product with a unique name, fixed price enabled, generated price, and generated maximum value
  Then a success message confirms the product was created
  And the user returns to the All Products list

Scenario: Create a Prepaid product
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Products page
  And the user creates a Prepaid product with a unique name, the ROOKIE retail wash type, and fixed quantity disabled
  Then a success message confirms the product was created
  And the user returns to the All Products list

Scenario: Create a Merchandise product
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Products page
  And the user creates a Merchandise product with a generated name and generated price
  Then a success message confirms the product was created
  And the user returns to the All Products list

Scenario: Create a Tip product
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Products page
  And the user creates a Tip product with a generated name
  Then a success message confirms the product was created
  And the user returns to the All Products list

Scenario: Create a Donation product
  Given the user is logged in
  When the user opens the Catalog section
  And the user opens the Products page
  And the user creates a Donation product with a generated name
  Then a success message confirms the product was created
  And the user returns to the All Products list
