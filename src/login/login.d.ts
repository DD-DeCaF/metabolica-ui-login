declare module "*.html" {
  const template: string;
  export default template;
}

declare module "*.json" {
  const json: string;
  export default json;
}

interface UserCredentials {
  email: string,
  password: string,
}

interface FirebaseCredentials {
  uid: string,
  token: string,
}
