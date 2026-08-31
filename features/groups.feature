Feature: Group Management

Scenario: Create a group and find it in the list
  Given the user is logged in
  When the user opens Groups
  And the user opens the All Groups page
  And the user starts creating a new group
  And the user enters a generated group name
  And the user selects a generated group type
  And the user creates the group
  And the user searches for the created group
  Then at least one matching group is shown in the list

Scenario: Create and delete a group
  Given the user is logged in
  When the user opens Groups
  And the user opens the All Groups page
  And the user creates a group with a generated name and type
  And the user searches for the created group
  Then the created group is visible in the list
  When the user deletes the created group and confirms the deletion
  And the user searches for the deleted group
  Then no matching group is shown in the list
