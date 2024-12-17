declare global {
	namespace App {
	  interface Locals {
		user: {
		  name: string
		  role: string
		}
	  }
	}
  }
  
  // Add proper typing for File in FormData
  interface FormData {
	get(name: string): string | File | null;
	getAll(name: string): (string | File)[];
  }
  
  export {};