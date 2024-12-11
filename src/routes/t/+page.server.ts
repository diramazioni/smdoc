import yaml from 'js-yaml'
import fs from 'fs/promises'
import path from 'node:path'
import { error } from '@sveltejs/kit';
import { 
	getMD,
	loadMD,
	copyTemplate,
	setMD, 
	getFileList, 
	getContent, 
	docDir,
	assetsDir 
  } from '$lib/api'



export const actions = {
	save: async ({ params, request }) => {
		try {
			console.log('save')
			const data = await request.formData();
			const updatedContent = data.get('updatedContent')
			console.log(updatedContent)
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'An unknown error occurred'
			};
		}
	}
};
