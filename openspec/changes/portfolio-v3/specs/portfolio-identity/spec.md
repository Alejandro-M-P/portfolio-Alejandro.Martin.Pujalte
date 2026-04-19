# Portfolio Identity Specification

## Purpose

This specification defines the profile section that serves as the primary identity for the portfolio. It presents ALEJANDRO.MP with a photo, name, system availability status, and contact call-to-action.

## Design Reference

- Background: `#050505` (Carbono)
- Containers: `#0A0A0A`
- Text/Lines: `#FFFFFF`
- Accent: `#0055FF` (Cobalt Blue)
- Typography: IBM Plex Mono (primary)
- Geometry: `0px` border-radius, `1px` borders

## Requirements

### Requirement: Profile Photo Display

The profile photo MUST be rendered as a perfect circle with a 1px solid white border.

#### Scenario: Profile photo renders correctly

- GIVEN a valid profile photo URL is provided
- WHEN the component mounts
- THEN the photo displays as a circle with 1px `#FFFFFF` border
- AND the image is centered within the circular boundary

#### Scenario: Photo fails to load

- GIVEN the profile photo URL returns an error or is invalid
- WHEN the image fails to load
- THEN a fallback placeholder displays (solid `#0A0A0A` with centered text "NO_SIGNAL")

### Requirement: Name Display

The profile name MUST display as "ALEJANDRO.MP" in bold using IBM Plex Mono.

#### Scenario: Name displays correctly

- GIVEN the profile component renders
- WHEN the page loads
- THEN "ALEJANDRO.MP" displays in uppercase
- AND font-weight is bold (700)
- AND font-family is IBM Plex Mono

### Requirement: System Availability Bar

The availability bar MUST display as a blue progress indicator showing 99.9% system availability.

#### Scenario: Availability bar shows correct percentage

- GIVEN the availability value is 99.9
- WHEN the component renders
- THEN a progress bar fills to 99.9% width
- AND the fill color is `#0055FF` (Cobalt Blue)
- AND the label shows "SYSTEM_READY: 99.9%"

#### Scenario: Availability bar with different values

- GIVEN an availability value between 0 and 100
- WHEN the component renders
- THEN the progress bar fills proportionally
- AND the label displays the percentage value

### Requirement: Contact CTA Button

The contact button MUST display as a solid blue button with text "INITIATE_CONTACT ->".

#### Scenario: Contact button renders

- GIVEN the profile section renders
- WHEN the page loads
- THEN the button displays with background `#0055FF`
- AND text color is `#FFFFFF`
- AND text reads "INITIATE_CONTACT ->"
- AND border-radius is 0px

#### Scenario: Contact button click

- GIVEN the user clicks the contact button
- WHEN the click event fires
- THEN navigation occurs to the contact route or mailto action
- AND the button shows a pressed state (slightly darker blue)

#### Scenario: Contact button hover

- GIVEN the user hovers over the contact button
- WHEN the mouse enters the button area
- THEN cursor changes to pointer
- AND background brightens slightly to `#0066FF`

## Layout Requirements

### Requirement: Section Container

The identity section MUST be contained in a box with the following properties:

- GIVEN a container element
- WHEN rendering
- THEN background is `#0A0A0A`
- AND border is 1px solid `#FFFFFF`
- AND padding is sufficient to contain all child elements

### Requirement: Responsive Layout

The section MUST adapt to different screen sizes:

- GIVEN mobile viewport (under 640px)
- WHEN rendering
- THEN elements stack vertically center-aligned

- GIVEN desktop viewport (640px and above)
- WHEN rendering
- THEN photo appears alongside text elements
- AND layout is horizontal flexbox