# What Do I Need To Get Done?
Create the auth supertokens plugin.

## Authorization

* Guard routes by default based on roles.

## Integration With Existing Amplication DB

* When the user is authenticated by the service, how will the rest of the app know
who the user is?

### How The Rest Of the App Will Know Who The User Is
A new field will be added to the auth model: supertokensId. This field will contain the corresponding
supertokens ID of the amplication users.

When CRUD operations are performed, the following concerns must be addressed:
Create - When a new user is created, a supertokens ID must be stored with the user row in the supertokensId field.
Read - Nothing needs to be done, as this doesn't do any modifications.
Update - The ID should not be updated because that can lead to the stored supertokensId going out of sync with
the actual one on the supertokens core.
Delete - When the user is deleted, the supertokens data for the user should be deleted too.

# I'm Thinking

* Because of the way supertokens works, a frontend interacting with the backend service will
need to make use of the supertokens frontend SDK. Should I generate code in the admin UI to do this
or should this be left to the user?

* Currently, in what I've done so far, auth recipes and their configuration are to be manually added by the
user. Should code be generated for this instead?

* Whenever a user is created, the user has to be setup on the supertokens side. They have to be in sync

# In Plugin, What I Need To Do to Build code on top of auth-core

1. Alter auth-core generated files & code:
* Remove:
    - token.service.ts: because supertokens will handle the tokens
    - password.service.ts: because supertokens will handle the passwords
    - password.service.spec.ts: because no more password.service.ts
    - LoginArgs.ts: because supertokens handles the logging in arguments
    - ITokenService.ts: because supertokens handles the tokens
    - IAuthStrategy.ts: because supertokens handles the validations & auth strategies
    - Credentials.ts: because authentication is now handled by supertokens
    - constants.ts and tests/auth: no longer need the constants
    - auth.service.ts: validating & logging in users is now done by supertokens
    - auth.service.spec.ts: because no more auth.service.ts
    - auth.controller.ts: because all auth routes will be handled automatically by supertokens
    - auth.resolver.ts: to use supertokens instead
    - tests/auth
* Keep:
    - gqlUserRoles.decorator.ts: because supertokens doesn't handle injection of roles into requests objects
    - gqlDefaultAuth.guard.ts: because supertokens doesn't guard graphql requests
    - gqlAC.guard.ts: because it's still needed for guarding routes
    - acl.module.ts: because it's still needed for authorization
    - abac.util.ts: because it's still needed in the request interceptor
    - password.service.ts: because it's still used to create user passwords
* Change:
    - main.ts to remove the { cors: true } setting because it doesn't work with supertokens
    - auth entity's controllers and graphql resolvers to accomodate the supertokens ID requirement
        + User controller base and main classes should accept the auth service in their constructors
        + The create route: modify the data argument to accept a UserCreateInput without a supertokensId
        + In the function body, create a supertokens user and insert the supertokensId from the user creation
            to create the user in the DB
        + The delete route: modify the function body to successfully delete the supertokens user before
            deleting the user in the DB
        + The update route: verify that the supertokensId is not being updated, so as to keep the
            server and supertokens core in sync
    - app.module.ts: graphql module should accept a { cors: origin: websiteDomain, credentials: true } and set graphql settings playground to false.
        so that the graphql authentication stuff can work
    - Remove the supertokensId field from the UserUpdateInput types. The one in the UserCreateInput should
        remain because it is needed to create a user after signing up but it should be changed to
        optional.


2. Add supertokens specific code:

* Add the boilerplate in the auth/supertokens directory
* Create the defaultAuth.guard.ts and set it to use the supertokens authguard
* Add the auth.module.ts file to the auth directory
* Add the cors settings to the createMicroservices function
* Add the supertokens auth filter to the useGlobalFilters in main.ts

3. Add the field to hold the supertokens ID to the auth entity model in the DSGContext

4. Change scripts/seed.ts to create the default user on supertokens core before 
creating in the Amplication DB. - Leave this to be done manually by the user.

5. Leave creating supertokens user for initial admin to the user.

# Still Need To Think About

* Sensible error handling
* Changing passwords and emails
* Other recipes and add-ons
* Check if auth throws "role not found" error when attempting to create a user
with non-existent roles
* LoginArgs should correspond with the method being used in supertokens.

# TODO Now To Complete The Phone Password Recipe
* Upgrade supertokens-node
* Install libphonenumber-js
* Alter supertokens service template
* Add phoneVerifiedClaim
* Update updateEmailPassword invocations to accept recipeUserIds.

# To Upgrade to Latest Supertokens
* Change dependency version.
* Add Session and SessionContainer import to auth entity resolver and controller.
* Change update user functions in resolver and controller to use the session to get the recipe user ID.
* Change the updateSupertokensEmailPassword function to accept recipe user ID instead of string

# Steps That Need to Be Done To Build Code On Top Of The Present
* Remove:
    In supertokens.service.ts
        - EmailPassword.init from recipeList
        - EmailPassword imports
* Remove password field, if any.
* Remove username field.
* In createSupertokensUser, use Passwordless instead of EmailPassword
* email and phoneNumber should be added to UserCreateInput
* email and phoneNumber should be passed as arguments to createSupertokensUser instead of username and
password.
* User creation in resolvers and controllers should take the new fields into account.
* Change getRecipeUserId to reflect the new login method.
* Add optional email and phoneNumber fields to the UserUpdateInput.

* Remove the username & password from the seed user creation.
    Remove username and password from templateMapping.DATA.seedingProperties

# To Build Code on Top of Passwordless Generated
* Change supertokens template.
* Update AuthError.ts
* Add optional email and thirdPartyId fields to Auth entity's create input DTO.
* Alter controller and resolver create function.
* Add optional email and thirdPartyId fields to the auth entity's update input DTO.
* Alter controller and resolver update function.

# To Build Code on Top Of Third Party
* Change supertokens template
* Add optional password field to auth entity update input DTO
* Alter controller and resolver update function
* Add password field to auth entity create input DTO
* Alter controller and resolver create function.

# TODO BEFORE PUSHING
* Fix the coupling between DTO and entity fields bug in admin-ui generator.
