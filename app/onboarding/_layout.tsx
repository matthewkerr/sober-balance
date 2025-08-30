import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="name" />
      <Stack.Screen name="reasons" />
      <Stack.Screen name="support" />
      <Stack.Screen name="sobriety" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
