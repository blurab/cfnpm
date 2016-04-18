# cfnpm

npm for cloud foundry, allow deployment of private local package to cloud foundry / bluemix / stackato

## Description

Imagine you have several applications that want to share the same common package but you don't want to publish your private package to npm for privacy reason.

This is something you can manage easly today with npm since it allow referencing local package dependency. But this is not compatible with the Cloud Foundry deployment model, you have no way to deploy a 'package' that other applications depends on.
Cloud foundry expect your private package to be packaged with your application.

cfmpm aims to solve this probleme by providing an automated way to package, with your application, all private local packages before beeing pushed to cloud foundry PaaS. 
In addition, cfnpm take care of the development environment by automaticaly managed a 'npm link' to all your private local packages, so you cann continue the develoment of your private local package and application transparently.

## How it works ?

cfnpm is a package that must be executed as a postintall script of npm, so you must update the package.json of your current application as follow:
```js
{
 ...
 "scripts": {
         "postinstall":"node -e \"require('cfnpm')\""
    },
 ...
}
```

So, each time you execute npm install, cfnpm will be executed post dependency resolution.

Now, to define your private local package, you must add a new field **privateDependencies** in your 'package.json' , this field must contain the list of private package and their location (same format package.json dependencies syntax):


```js
    "scripts": {
         "postinstall":"node -e \"require('cfnpm')\""
    },
    "dependencies": {
        "mongodb": "2.0.34"
    },
    "privateDependencies":{
	  "mymodule":"../mymodule"
    }
```

Now if you run npm install, you will see two things:
* your node_modules will contains link to your local package
* A new folder private_node_modules has been created and contains a copy of your local private package, this is for your futur deployment to cloud foundry

Now, once you push to cloud foundry, npm install is executed during the staging and cfnpm detect it is cloud foundry staging. it will then manage to :
- run npm install on all your private local package located in private_node_modules
- copy back all your private local package from private_node_modules to your node_modules

If you look at the test folder of cfnpm, there is dummy example of cfnpm usage, it contains two folders:
* **/amodule** that is the private local folder that aims to be shared by several application
* **/app** is one app that 'use' amodule
