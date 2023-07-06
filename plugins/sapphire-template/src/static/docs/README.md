# ${{ values.name }}

This is the basic boilerplate of NestJs App - with sapphire bootstrap, Good Luck!

To start the app, run:

```sh
npm install
npm start
```

### App folder - business logic:

In the app folder we have the business logic of our app, and adapters to our web-server framework. <br />
We have 2 folders: 
<ol>
  <li>Entities</li>
  <li>Use cases</li>
</ol>

These folders are related to the **_business logic only_**!
In these folders we shouldn't use any decorator of NestJs.