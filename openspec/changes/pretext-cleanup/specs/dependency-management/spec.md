# Delta for Dependency Management

## ADDED Requirements

None.

## MODIFIED Requirements

None.

## REMOVED Requirements

### Requirement: PRETEXT Dependency Installed

(Reason: Package was unused — no imports exist in codebase, consuming ~19KB bundle size unnecessarily)

### Requirement: PRETEXT Import Verification

(Reason: Verification step no longer needed — package being removed)

#### Scenario: No PRETEXT Imports Exist (DEPRECATED)

- GIVEN a codebase with `@chenglou/pretext` installed as a dependency
- WHEN searching for import statements referencing `@chenglou/pretext` or `pretext`
- THEN zero import statements should be found
- AND the dependency can be safely removed

#### Scenario: PRETEXT Imports Exist (DEPRECATED)

- GIVEN a codebase with `@chenglou/pretext` installed
- WHEN import statements referencing `@chenglou/pretext` or `pretext` are found
- THEN those imports must be removed before uninstalling the package

## Verification Requirements

### Requirement: Dependency Removal Verification

The build system MUST confirm successful removal of `@chenglou/pretext` from the project.

#### Scenario: npm uninstall Success

- GIVEN `@chenglou/pretext` is listed in package.json dependencies
- WHEN running `npm uninstall @chenglou/pretext`
- THEN the package is removed from package.json
- AND the package entry is removed from package-lock.json
- AND no npm errors are reported

#### Scenario: No Remaining Imports

- GIVEN `@chenglou/pretext` has been uninstalled
- WHEN searching the codebase for `@chenglou/pretext` or `pretext` imports
- THEN zero import statements should be found

#### Scenario: Dev Server Starts Without Errors

- GIVEN `@chenglou/pretext` has been removed from dependencies
- WHEN running the development server (`npm run dev`)
- THEN the server starts without errors
- AND the application loads correctly