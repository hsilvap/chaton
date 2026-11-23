package schemas

import (
	"bytes"
	"fmt"
	"sync"

	_ "embed"

	"github.com/santhosh-tekuri/jsonschema/v6"
)

const LayoutVersion = "0-0-2"

const layoutID = "https://chaton.dev/schemas/layout/0-0-2.json"

//go:embed layout-schema-0-0-2.json
var layoutJSON []byte

var compileLayout = sync.OnceValues(func() (*jsonschema.Schema, error) {
	doc, err := jsonschema.UnmarshalJSON(bytes.NewReader(layoutJSON))
	if err != nil {
		return nil, err
	}
	c := jsonschema.NewCompiler()
	c.AssertFormat()
	if err := c.AddResource(layoutID, doc); err != nil {
		return nil, err
	}
	return c.Compile(layoutID)
})

func ValidateLayout(raw []byte) error {
	schema, err := compileLayout()
	if err != nil {
		return fmt.Errorf("compile layout schema: %w", err)
	}
	v, err := jsonschema.UnmarshalJSON(bytes.NewReader(raw))
	if err != nil {
		return fmt.Errorf("layout is not valid JSON: %w", err)
	}
	return schema.Validate(v)
}
