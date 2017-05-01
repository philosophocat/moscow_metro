'use strict';

import { Selector } from 'testcafe';

fixture('Browser')
    .page('http://localhost:3000');

test('Browser', async (test) => {

    let svg = Selector('svg'),
        stations = Selector('.moscow_metro_map__station');

    await test.expect( svg.exists ).ok();
    await test.click( stations.nth(1) );
    await test.click( stations.nth(2) );
    await test.click( stations.nth(3) );
    await test.expect( stations.nth(1).hasClass('selected') ).ok();
    await test.expect( stations.nth(2).hasClass('selected') ).ok();
    await test.expect( stations.nth(3).hasClass('selected') ).ok();
    const selected = await test.eval(() => window.map.getSelected());
    await test.expect( selected.length ).eql(3);
    
});

function delay(x) {
    return new Promise(resolve => {
        setTimeout(resolve, x);
    });
}