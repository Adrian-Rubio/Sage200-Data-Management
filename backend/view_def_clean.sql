CREATE VIEW dbo.CEN_PowerBi_LineasPedVen_Vendedor
AS
SELECT dbo.LineasPedidoCliente.CodigoEmpresa, dbo.LineasPedidoCliente.EjercicioPedido, dbo.LineasPedidoCliente.SeriePedido, dbo.LineasPedidoCliente.NumeroPedido, dbo.LineasPedidoCliente.Orden AS LineaPedido, 
                  dbo.LineasPedidoCliente.CodigoArticulo, dbo.LineasPedidoCliente.CodigoFamilia, dbo.LineasPedidoCliente.ImporteNetoPendiente, dbo.LineasPedidoCliente.FechaEntrega, CASE WHEN LineasPedidoCliente.CodigoComisionista <> 0 AND 
                  LineasPedidoCliente.[%Comision] > 0 THEN LineasPedidoCliente.CodigoComisionista WHEN LineasPedidoCliente.CodigoComisionista2_ <> 0 AND 
                  LineasPedidoCliente.[%Comision2_] > 0 THEN LineasPedidoCliente.CodigoComisionista2_ WHEN LineasPedidoCliente.CodigoComisionista3_ <> 0 AND 
                  LineasPedidoCliente.[%Comision3_] > 0 THEN LineasPedidoCliente.CodigoComisionista3_ WHEN LineasPedidoCliente.CodigoComisionista4_ <> 0 AND 
                  LineasPedidoCliente.[%Comision4_] > 0 THEN LineasPedidoCliente.CodigoComisionista4_ ELSE 0 END AS CodigoComisionistaLinea, dbo.LineasPedidoCliente.Precio AS PrecioVenta, dbo.LineasPedidoCliente.PrecioCoste, 
                  CASE WHEN LineasPedidoCliente.Precio = 0 THEN 0 ELSE ((LineasPedidoCliente.Precio - LineasPedidoCliente.PrecioCoste) / LineasPedidoCliente.Precio) * 100 END AS MargenVenta, dbo.LineasPedidoCliente.DescripcionArticulo, 
                  dbo.LineasPedidoCliente.CodigoProveedor, dbo.LineasPedidoCliente.[%Descuento], dbo.LineasPedidoCliente.ImporteCoste, dbo.LineasPedidoCliente.ImporteNeto, dbo.CabeceraPedidoCliente.FechaPedido, 
                  dbo.CabeceraPedidoCliente.RazonSocial, dbo.CabeceraPedidoCliente.CodigoPostal, dbo.CabeceraPedidoCliente.CodigoMunicipio, dbo.CabeceraPedidoCliente.Municipio, dbo.CabeceraPedidoCliente.Provincia, 
                  dbo.CabeceraPedidoCliente.CodigoProvincia, dbo.CabeceraPedidoCliente.CodigoNacion, dbo.CabeceraPedidoCliente.Nacion, dbo.CabeceraPedidoCliente.FormadePago, dbo.CabeceraPedidoCliente.FechaEntrega AS Expr1, 
                  dbo.LineasPedidoCliente.BaseImponiblePendiente, dbo.LineasPedidoCliente.UnidadesPendientes, dbo.CabeceraPedidoCliente.FechaTope, dbo.LineasPedidoCliente.CodigoComisionista, dbo.CabeceraPedidoCliente.ImporteFactura, 
                  dbo.CabeceraPedidoCliente.CodigoCliente, dbo.CabeceraPedidoCliente.CodigoTipoClienteLc, dbo.CabeceraPedidoCliente.BaseImponible
FROM     dbo.LineasPedidoCliente WITH (NOLOCK) LEFT OUTER JOIN
                  dbo.CabeceraPedidoCliente WITH (NOLOCK) ON dbo.LineasPedidoCliente.CodigoEmpresa = dbo.CabeceraPedidoCliente.CodigoEmpresa AND dbo.LineasPedidoCliente.EjercicioPedido = dbo.CabeceraPedidoCliente.EjercicioPedido AND 
                  dbo.LineasPedidoCliente.SeriePedido = dbo.CabeceraPedidoCliente.SeriePedido AND dbo.LineasPedidoCliente.NumeroPedido = dbo.CabeceraPedidoCliente.NumeroPedido
WHERE  (dbo.LineasPedidoCliente.Estado <> 2) AND (dbo.LineasPedidoCliente.UnidadesPendientes <> 0) AND (dbo.CabeceraPedidoCliente.Estado <> 2) AND (dbo.LineasPedidoCliente.SeriePedido <> 'NOFA')
