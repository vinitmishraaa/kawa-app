import { ReactNode } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: ReactNode;
  scroll?: boolean;
}

export function ScreenContainer({ children, scroll = false }: Props) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <Wrapper
        className="flex-1"
        contentContainerStyle={scroll ? { flexGrow: 1, padding: 20 } : undefined}
        style={!scroll ? { flex: 1, padding: 20 } : undefined}
      >
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}
