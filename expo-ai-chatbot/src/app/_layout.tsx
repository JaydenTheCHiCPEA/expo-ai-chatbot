import { Drawer } from "expo-router/drawer";
import Providers from "@/providers";
import { DrawerContent } from "@/components/drawer-content";

function WrappedDrawerContent() {
  return <DrawerContent />;
}

export default function Layout() {
  return (
    <Providers>
      <Drawer 
        drawerContent={() => <WrappedDrawerContent />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: "#f0f9ff",
          },
          sceneStyle: {
            backgroundColor: "#f0f9ff",
          },
        }}
      />
    </Providers>
  );
}
