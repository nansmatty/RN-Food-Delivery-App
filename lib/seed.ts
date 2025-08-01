import * as FileSystem from 'expo-file-system';
import { ID } from 'react-native-appwrite';
import { appwriteConfig, databases, storage } from './appwrite';
import dummyData from './data';

interface Category {
	name: string;
	description: string;
}

interface Customization {
	name: string;
	price: number;
	type: 'topping' | 'side' | 'size' | 'crust' | string; // extend as needed
}

interface MenuItem {
	name: string;
	description: string;
	image_url: string;
	price: number;
	rating: number;
	calories: number;
	protein: number;
	category_name: string;
	customizations: string[]; // list of customization names
}

interface DummyData {
	categories: Category[];
	customizations: Customization[];
	menu: MenuItem[];
}

// ensure dummyData has correct shape
const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
	const list = await databases.listDocuments(appwriteConfig.databaseId, collectionId);

	await Promise.all(list.documents.map((doc) => databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)));
}

async function clearStorage(): Promise<void> {
	const list = await storage.listFiles(appwriteConfig.bucketId);

	await Promise.all(list.files.map((file) => storage.deleteFile(appwriteConfig.bucketId, file.$id)));
}

// async function uploadImageToStorage(imageUrl: string) {
// 	const response = await fetch(imageUrl);
// 	const blob = await response.blob();

// 	const fileObj = {
// 		name: imageUrl.split('/').pop() || `file-${Date.now()}.jpg`,
// 		type: blob.type,
// 		size: blob.size,
// 		uri: imageUrl,
// 	};

// 	const file = await storage.createFile(appwriteConfig.bucketId, ID.unique(), fileObj);

// 	return storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
// }

async function uploadImageToStorage(imageUrl: string) {
	try {
		// Get file name from URL
		const filename = imageUrl.split('/').pop() || `file-${Date.now()}.jpg`;

		// Define local path where image will be saved
		const localUri = FileSystem.cacheDirectory + filename;

		// Download the file to cache directory
		const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);

		// Upload the downloaded file to Appwrite
		// Get file info to retrieve the size
		const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri, { size: true });

		const fileSize = 'size' in fileInfo ? (fileInfo as any).size : 0;

		const file = await storage.createFile(appwriteConfig.bucketId, ID.unique(), {
			uri: downloadResult.uri, // ✅ Local file URI
			name: filename,
			type: 'image/png', // 🔧 Or infer from filename if needed
			size: fileSize, // Add the required size property
		});

		// Return a viewable URL
		return storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
	} catch (err) {
		console.error('Error uploading image:', imageUrl, err);
		return null;
	}
}

async function seed(): Promise<void> {
	// 1. Clear all
	await clearAll(appwriteConfig.categoriesCollectionId);
	await clearAll(appwriteConfig.customizationsCollectionId);
	await clearAll(appwriteConfig.menuCollectionId);
	await clearAll(appwriteConfig.menuCustomizationsCollectionId);
	await clearStorage();

	console.log('Clear storage and collections complete.');

	// 2. Create Categories
	const categoryMap: Record<string, string> = {};
	for (const cat of data.categories) {
		const doc = await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.categoriesCollectionId, ID.unique(), cat);
		categoryMap[cat.name] = doc.$id;
	}

	console.log('Categories created:', Object.keys(categoryMap).length);

	// 3. Create Customizations
	const customizationMap: Record<string, string> = {};
	for (const cus of data.customizations) {
		const doc = await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.customizationsCollectionId, ID.unique(), {
			name: cus.name,
			price: cus.price,
			type: cus.type,
		});
		customizationMap[cus.name] = doc.$id;
	}

	console.log('Customizations created:', Object.keys(customizationMap).length);

	// 4. Create Menu Items
	const menuMap: Record<string, string> = {};
	for (const item of data.menu) {
		const uploadedImage = await uploadImageToStorage(item.image_url);

		if (!uploadedImage) {
			console.error(`Failed to upload image for menu item: ${item.name}`);
			continue;
		}

		const doc = await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.menuCollectionId, ID.unique(), {
			name: item.name,
			description: item.description,
			image_url: uploadedImage,
			price: item.price,
			rating: item.rating,
			calories: item.calories,
			protein: item.protein,
			categories: categoryMap[item.category_name],
		});

		menuMap[item.name] = doc.$id;

		// 5. Create menu_customizations
		for (const cusName of item.customizations) {
			await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.menuCustomizationsCollectionId, ID.unique(), {
				menu: doc.$id,
				customizations: customizationMap[cusName],
			});
		}
	}

	console.log('Menu items created:', Object.keys(menuMap).length);

	console.log('✅ Seeding complete.');
}

export default seed;
