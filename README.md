# iiif-av-component

    npm i
    npm run build
    npm start
    
 ## Example Manifests
 
 https://iiif-commons.github.io/iiif-av-component/examples/data/bl/sounds-tests/index.html

 ## Publishing

Checkout the `master` branch, and ensure it is up-to-date.

Run `npm version [major | minor | patch]` for example:

```
npm version patch
```

This will update the `package.json` version and create a git tag. Then push both the main/tag.

```
git push origin main v0.0.8
```

Then the GitHub action will pick up the tag and publish it to NPM :tada:
 
