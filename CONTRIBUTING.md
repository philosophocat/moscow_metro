## Contributing

This map is based on the official metro scheme. To actualize it, grab svg-file from [mosmetro](http://mosmetro.ru/metro-map/) and place it into src/map folder; 
Then add new stations and check-icons positions (if there are new stations) to the json file. `npm run build` will help to build the bundle. Do not forget to upgrade package version.

## P.S.
If you have time, especially welcome:
- browser tests (testcafe, maybe)
- scaling engine refactoring (css-based engine allows animations)
