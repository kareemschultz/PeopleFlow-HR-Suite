import { env } from "@PeopleFlow-HR-Suite/env/native";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";

// Create storage adapter from named imports
const secureStorage = {
	getItem: getItemAsync,
	setItem: setItemAsync,
	removeItem: deleteItemAsync,
};

export const authClient = createAuthClient({
	baseURL: env.EXPO_PUBLIC_SERVER_URL,
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storagePrefix: Constants.expoConfig?.scheme as string,
			storage: secureStorage,
		}),
	],
});
