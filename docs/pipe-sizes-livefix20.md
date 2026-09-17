# Carbon Steel 22, 26 and 28 inch support

Target: livefix20 and dev alpha264. No other dev features are promoted.

Nominal sizes 22, 26 and 28 use the same inch OD. STD wall is 0.375 inch
and XS wall is 0.500 inch; IDs are OD minus twice wall thickness.
Source: manufacturer dimensional chart:
https://www.sachiyasteelintl.com/large-diameter-pipe-manufacturers-india.html

Schedule 40/80 defaults are deliberately blank for these new sizes rather than
equating them to STD/XS. Enter the actual inside diameter for other wall
thicknesses. Existing size tables are unchanged.

No 22/26/28 nominal Ductile Iron presets are added: the user has no manufacturer
dimensions and the U.S. Pipe chart does not list these nominal sizes.
https://www.uspipe.com/wp-content/uploads/2020/12/USPIPE-DIP-ID-CHART-02052019.pdf

Follow-up: verified ductile dimensions or a separately tested custom measured
OD path. Do not infer ductile OD from steel nominal size.
