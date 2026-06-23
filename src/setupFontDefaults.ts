import { Text, TextInput } from 'react-native';

const AppText = Text as typeof Text & {
  defaultProps?: { style?: { fontFamily: string } };
};
const AppTextInput = TextInput as typeof TextInput & {
  defaultProps?: { style?: { fontFamily: string } };
};

if (AppText.defaultProps == null) {
  AppText.defaultProps = {};
}
AppText.defaultProps.style = { fontFamily: 'Cafe24PROSlim-Regular' };

if (AppTextInput.defaultProps == null) {
  AppTextInput.defaultProps = {};
}
AppTextInput.defaultProps.style = { fontFamily: 'Cafe24PROSlim-Regular' };
